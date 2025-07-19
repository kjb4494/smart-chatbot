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

interface QuestionAnalysis {
  searchQuery: string;
  filters: {
    courtName?: string;
    caseType?: string;
    dateRange?: {
      from?: string;
      to?: string;
    };
    keywords?: string[];
  };
  intent: string;
  legalArea?: string;
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

  /**
   * 법률 질문을 분석하여 검색 최적화 정보 추출
   */
  public async analyzeQuestion(question: string): Promise<QuestionAnalysis> {
    try {
      this.logger.debug('Analyzing legal question with OpenAI...');

      const systemPrompt = `당신은 대한민국 법률 검색 전문가입니다. 
사용자의 질문을 분석하여 벡터 검색에 최적화된 정보를 추출해주세요.

다음 정보를 JSON 형태로 제공해주세요:
- searchQuery: 벡터 검색에 최적화된 검색어 (핵심 키워드 중심으로 재작성)
- filters: 검색 필터 정보
  - courtName: 법원명 (대법원, 고등법원, 지방법원 등)
  - caseType: 사건종류 (민사, 형사, 행정, 헌법 등)
  - dateRange: 날짜 범위 {from: "YYYY-MM-DD", to: "YYYY-MM-DD"}
  - keywords: 핵심 키워드 배열
- intent: 질문의 의도 (판례검색, 법리해석, 절차문의 등)
- legalArea: 법률 분야 (민법, 형법, 행정법, 헌법 등)

검색어는 판례 검색에 효과적이도록 법률 용어를 포함하여 작성해주세요.
필터는 질문에서 명시적으로 언급된 경우에만 포함하세요.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const parsedContent = response.choices[0].message.content;
      if (!parsedContent) {
        throw new Error('OpenAI returned empty response');
      }

      const analysis = JSON.parse(parsedContent) as QuestionAnalysis;

      this.logger.info(
        `Question analyzed - Intent: ${analysis.intent}, Legal Area: ${analysis.legalArea}`,
      );
      return analysis;
    } catch (error) {
      this.logger.error('Error analyzing legal question:', error);
      throw new RestServerException(
        'Error analyzing legal question with OpenAI',
      );
    }
  }

  /**
   * 검색된 판례들을 바탕으로 질문에 대한 답변 생성
   */
  public async generateAnswer(
    question: string,
    searchResults: Array<{
      metadata: Record<string, any>;
      score: number;
    }>,
  ): Promise<string> {
    try {
      this.logger.debug('Generating answer based on search results...');

      if (searchResults.length === 0) {
        return '질문과 관련된 판례를 찾을 수 없습니다. 다른 키워드로 검색해보시거나 더 구체적인 질문을 해주세요.';
      }

      // 판례 정보를 텍스트로 구성
      const precedentsText = searchResults
        .map((result, index) => {
          const meta = result.metadata;
          return `
=== 판례 ${index + 1} (유사도: ${(result.score * 100).toFixed(1)}%) ===
• 사건명: ${meta.caseName || '정보없음'}
• 사건번호: ${meta.caseNumber || '정보없음'}
• 법원: ${meta.courtName || '정보없음'}
• 사건종류: ${meta.caseType || '정보없음'}
• 선고일자: ${meta.decisionDate || '정보없음'}
• 판시사항: ${meta.subjectMatter || '정보없음'}
• 판결요지: ${meta.legalPrinciple || '정보없음'}
${meta.referencedLaws ? `• 참조조문: ${meta.referencedLaws}` : ''}
${meta.referencedCases ? `• 참조판례: ${meta.referencedCases}` : ''}
`;
        })
        .join('\n');

      const systemPrompt = `당신은 대한민국의 법률 전문가입니다. 
제공된 판례들을 분석하여 사용자의 질문에 대해 정확하고 도움이 되는 답변을 제공해주세요.

답변 작성 가이드라인:
1. 관련 판례들의 핵심 내용을 요약하여 설명
2. 질문과 직접적으로 관련된 법리 해석 제공
3. 실무적 관점에서 도움이 될 만한 정보 포함
4. 판례의 사건번호와 법원명을 인용하여 신뢰성 확보
5. 명확하고 이해하기 쉬운 한국어로 작성
6. 결론은 간단명료하게 정리

주의사항:
- 제공된 판례 정보만을 바탕으로 답변하세요
- 확실하지 않은 내용은 추측하지 마세요
- 법률 자문이 아닌 일반적인 정보 제공임을 명시하세요`;

      const userPrompt = `
질문: ${question}

관련 판례들:
${precedentsText}

위 판례들을 바탕으로 질문에 대한 답변을 작성해주세요.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const answer = response.choices[0].message.content;
      if (!answer) {
        throw new Error('OpenAI returned empty response');
      }

      this.logger.info('Answer generated successfully');
      return answer;
    } catch (error) {
      this.logger.error('Error generating answer:', error);
      throw new RestServerException('Error generating answer with OpenAI');
    }
  }
}
