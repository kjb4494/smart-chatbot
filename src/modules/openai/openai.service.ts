import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import OpenAI from 'openai';
import { RestServerException } from 'src/common/exceptions/rest.server.exception';
import { Logger } from 'winston';

interface ParsedLegalData {
  caseId: string;
  caseName: string;
  caseNumber: string;
  courtName: string;
  caseType: string;
  decisionDate: string;
  subjectMatter: string;
  legalPrinciple: string;
  referencedLaws?: string;
  referencedCases?: string;
  content: string;
}

@Injectable()
export class OpenaiService {
  private openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    this.init();
  }

  private init() {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.logger.debug(`OPENAI_API_KEY: ${apiKey}`);

    if (!apiKey) {
      this.logger.warn(
        'OPENAI_API_KEY environment variable is not set. OpenAI features will not work.',
      );
      return;
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
    });

    this.logger.info('OpenAI initialized');
  }

  public getOpenai() {
    if (!this.openai) {
      throw new RestServerException('OpenAI is not initialized');
    }
    return this.openai;
  }

  public async getTextEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      this.logger.error('Error getting text embedding:', error);
      throw new RestServerException('Error getting text embedding');
    }
  }

  /**
   * 법률 텍스트를 분석하여 구조화된 데이터로 변환
   */
  public async parseLegalText(legalText: string): Promise<ParsedLegalData> {
    try {
      this.logger.debug('Parsing legal text with OpenAI...');

      const systemPrompt = `당신은 대한민국 법률 판례 분석 전문가입니다. 
주어진 판례 텍스트나 JSON 데이터를 분석하여 다음 필드들을 정확히 추출해주세요:

필수 추출 정보:
- caseId: 판례일련번호 (문자열)
- caseName: 사건명
- caseNumber: 사건번호
- courtName: 법원명 
- caseType: 사건종류명 (예: 민사, 형사, 행정 등)
- decisionDate: 선고일자 (YYYY-MM-DD 형식)
- subjectMatter: 판시사항 (【판시사항】 부분에서 추출)
- legalPrinciple: 판결요지 (【판결요지】 부분에서 추출)
- content: 판례 전문 내용

선택 추출 정보:
- referencedLaws: 참조조문 (【참조조문】 부분)
- referencedCases: 참조판례 (【참조판례】 부분)

응답은 반드시 JSON 형태로만 제공하고, 다른 설명은 포함하지 마세요.
날짜는 YYYY-MM-DD 형식으로 변환해주세요.
판시사항과 판결요지에서 【】 부분의 헤더는 제거하고 내용만 추출해주세요.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: legalText },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const parsedContent = response.choices[0].message.content;
      if (!parsedContent) {
        throw new Error('OpenAI returned empty response');
      }

      const parsedData = JSON.parse(parsedContent) as ParsedLegalData;

      // 필수 필드 검증
      const requiredFields = [
        'caseId',
        'caseName',
        'caseNumber',
        'courtName',
        'caseType',
        'decisionDate',
        'subjectMatter',
        'legalPrinciple',
        'content',
      ];
      for (const field of requiredFields) {
        if (!parsedData[field as keyof ParsedLegalData]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      this.logger.info(
        `Successfully parsed legal text for case: ${parsedData.caseId}`,
      );
      return parsedData;
    } catch (error) {
      this.logger.error('Error parsing legal text:', error);
      throw new RestServerException('Error parsing legal text with OpenAI');
    }
  }
}
