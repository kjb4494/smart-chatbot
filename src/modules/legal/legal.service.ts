import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { RestServerException } from 'src/common/exceptions/rest.server.exception';
import { Logger } from 'winston';
import { OpenaiService } from '../openai/openai.service';
import { PineconeService } from '../pinecone/pinecone.service';
import {
  LegalTextUpsertReqDto,
  LegalUpsertReqDto,
} from './dto/req/legal.upsert.req.dto';

@Injectable()
export class LegalService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly pineconeService: PineconeService,
    private readonly openaiService: OpenaiService,
  ) {}

  async upsertLegal(legal: LegalUpsertReqDto): Promise<string> {
    this.logger.info(`Upserting legal case: ${legal.caseId}`);

    try {
      // 1. 임베딩할 텍스트 구성 (검색성을 위해 주요 정보 조합)
      const textToEmbed = this.buildSearchableText(legal);

      // 2. OpenAI로 텍스트 임베딩 생성
      this.logger.debug(`Creating embedding for case: ${legal.caseId}`);
      const embedding = await this.openaiService.getTextEmbedding(textToEmbed);

      // 3. Pinecone 벡터 ID 생성 (법률 판례용 고유 ID)
      const vectorId = `legal_${legal.caseId}_${Date.now()}`;

      // 4. 메타데이터 구성
      const metadata = this.buildMetadata(legal);

      // 5. Pinecone에 벡터 저장
      const index = this.pineconeService.getDefaultIndex();
      await index.upsert([
        {
          id: vectorId,
          values: embedding,
          metadata: metadata,
        },
      ]);

      this.logger.info(
        `Legal case upserted successfully: ${legal.caseId} -> ${vectorId}`,
      );
      return vectorId;
    } catch (error) {
      this.logger.error(`Error upserting legal case ${legal.caseId}:`, error);
      throw new RestServerException('Error upserting legal case');
    }
  }

  /**
   * 텍스트를 받아서 OpenAI가 자동으로 파싱한 후 저장
   */
  async upsertLegalFromText(legalTextDto: LegalTextUpsertReqDto): Promise<{
    vectorId: string;
    parsedData: any;
  }> {
    this.logger.info('Starting auto-parse and upsert process');

    try {
      // 1. OpenAI로 텍스트 파싱
      this.logger.debug('Parsing legal text with OpenAI...');
      const parsedData = await this.openaiService.parseLegalText(
        legalTextDto.legalText,
      );

      // 2. 파싱된 데이터를 LegalUpsertReqDto 형태로 변환
      const legalDto: LegalUpsertReqDto = {
        caseId: parsedData.caseId,
        caseName: parsedData.caseName,
        caseNumber: parsedData.caseNumber as any, // OpenAI에서 문자열로 받아와서 number로 변환
        courtName: parsedData.courtName,
        caseType: parsedData.caseType,
        decisionDate: parsedData.decisionDate,
        subjectMatter: parsedData.subjectMatter,
        legalPrinciple: parsedData.legalPrinciple,
        referencedLaws: parsedData.referencedLaws,
        referencedCases: parsedData.referencedCases,
        content: parsedData.content,
        metadata: {
          // 기본 메타데이터 - 유연한 Record 타입 활용
          source: 'auto_parsed',
          parsedAt: new Date().toISOString(),
          originalTextLength: legalTextDto.legalText.length,
          // 추가 메타데이터 병합
          ...legalTextDto.additionalMetadata,
        } as any, // 유연한 메타데이터 처리를 위해 any 사용
      };

      // 3. 기존 upsertLegal 메서드 사용하여 저장
      const vectorId = await this.upsertLegal(legalDto);

      this.logger.info(
        `Auto-parsed legal case saved successfully: ${parsedData.caseId} -> ${vectorId}`,
      );

      return {
        vectorId,
        parsedData: {
          caseId: parsedData.caseId,
          caseName: parsedData.caseName,
          caseNumber: parsedData.caseNumber,
          courtName: parsedData.courtName,
          caseType: parsedData.caseType,
          decisionDate: parsedData.decisionDate,
        },
      };
    } catch (error) {
      this.logger.error('Error in auto-parse and upsert process:', error);
      throw new RestServerException('Error parsing and storing legal text');
    }
  }

  /**
   * 검색 가능한 텍스트를 구성합니다
   * 주요 정보들을 조합하여 검색성을 높입니다
   */
  private buildSearchableText(legal: LegalUpsertReqDto): string {
    const parts = [
      `사건명: ${legal.caseName}`,
      `사건번호: ${legal.caseNumber}`,
      `법원: ${legal.courtName}`,
      `사건종류: ${legal.caseType}`,
      `선고일자: ${legal.decisionDate}`,
      `판시사항: ${legal.subjectMatter}`,
      `판결요지: ${legal.legalPrinciple}`,
    ];

    // 선택적 정보 추가
    if (legal.referencedLaws) {
      parts.push(`참조조문: ${legal.referencedLaws}`);
    }

    if (legal.referencedCases) {
      parts.push(`참조판례: ${legal.referencedCases}`);
    }

    // 판례 내용 전문 추가
    parts.push(`\n\n판례내용:\n${legal.content}`);

    return parts.join('\n');
  }

  /**
   * Pinecone 메타데이터를 구성합니다
   * 검색 필터링과 결과 표시에 사용됩니다
   */
  private buildMetadata(legal: LegalUpsertReqDto): Record<string, any> {
    const metadata: Record<string, any> = {
      // 기본 정보
      caseId: legal.caseId,
      caseName: legal.caseName,
      caseNumber: legal.caseNumber.toString(),
      courtName: legal.courtName,
      caseType: legal.caseType,
      decisionDate: legal.decisionDate,

      // 핵심 내용
      subjectMatter: legal.subjectMatter,
      legalPrinciple: legal.legalPrinciple,

      // 시스템 정보
      dataType: 'legal_case',
      createdAt: new Date().toISOString(),

      // 텍스트 길이 정보
      contentLength: legal.content.length,
    };

    // 선택적 정보 추가
    if (legal.referencedLaws) {
      metadata.referencedLaws = legal.referencedLaws;
    }

    if (legal.referencedCases) {
      metadata.referencedCases = legal.referencedCases;
    }

    // 사용자 정의 메타데이터 병합
    if (legal.metadata) {
      Object.assign(metadata, legal.metadata);
    }

    return metadata;
  }
}
