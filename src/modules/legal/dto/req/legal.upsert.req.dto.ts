import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class LegalUpsertReqDto {
  @ApiProperty({
    description: '판례 ID',
    example: '93810',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  caseId: string;

  @ApiProperty({
    description: '사건명',
    example: '소유권이전등기말소',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  caseName: string;

  @ApiProperty({
    description: '사건번호',
    example: '73다740',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  caseNumber: number;

  @ApiProperty({
    description: '법원명',
    example: '대법원',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  courtName: string;

  @ApiProperty({
    description: '사건종류명',
    example: '민사',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  caseType: string;

  @ApiProperty({
    description: '선고일자',
    example: '1978-04-11',
    required: true,
  })
  @IsDateString()
  @IsNotEmpty()
  decisionDate: string;

  @ApiProperty({
    description: '판시사항',
    example: '분배농지 상한선 초과부분에 대한 당연무효여부를 결정하는 기준시기',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  subjectMatter: string;

  @ApiProperty({
    description: '판결요지',
    example:
      '분배농지 상한선이 초과된 부분에 대한 분배처분의 효력유무를 결정함에는 원칙적으로 농지분배의 효력발생시기 즉 분배처분확정당시를 기준으로 하여야 하지만 적법히 이루어진 분배처분으로 추정되는 경우에는 예외적으로 수분배자가 상환을 완료한 때를 기준으로 하여야 한다.',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  legalPrinciple: string;

  @ApiPropertyOptional({
    description: '참조조문',
    example: '농지개혁법 제12조',
  })
  @IsString()
  @IsOptional()
  referencedLaws?: string;

  @ApiPropertyOptional({
    description: '참조판례',
    example: '대법원 1967.6.20. 선고 67다564 판결',
  })
  @IsString()
  @IsOptional()
  referencedCases?: string;

  @ApiProperty({
    description: '판례내용',
    example:
      '【전문】\n\n【원고, 피상고인】 원고 소송대리인 변호사 김병화, 조덕환\n\n...',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: '판례 메타데이터',
    example: {
      legalField: '농지',
      keywords: ['판결', '농지', '분배'],
      tags: ['농지개혁법', '농지분배', '농지분배처분'],
      category: '농지',
      importance: 1,
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: {
    legalField?: string;
    keywords?: string[];
    tags?: string[];
    category?: string;
    importance?: number;
  };
}

// 새로운 DTO: 단순 텍스트로 입력받는 용도
export class LegalTextUpsertReqDto {
  @ApiProperty({
    description: '판례 텍스트 (OpenAI가 자동으로 분석하여 구조화)',
    example: `{
    "판례일련번호": 93810,
    "사건명": "소유권이전등기말소",
    "사건번호": "73다740",
    "선고일자": "1978-04-11",
    "법원명": "대법원",
    "사건종류명": "민사",
    "판시사항": "분배농지 상한선 초과부분에 대한 당연무효여부를 결정하는 기준시기",
    "판결요지": "분배농지 상한선이 초과된 부분에 대한 분배처분의 효력유무를 결정함에는...",
    "참조조문": "농지개혁법 제12조",
    "참조판례": "대법원 1967.6.20. 선고 67다564 판결",
    "판례내용": "【전문】\n\n【원고, 피상고인】 원고 소송대리인 변호사 김병화, 조덕환..."
}`,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  legalText: string;

  @ApiPropertyOptional({
    description: '추가 메타데이터 (선택사항)',
    example: {
      source: 'manual_input',
      uploadedBy: 'admin',
      category: '판례',
    },
  })
  @IsOptional()
  @IsObject()
  additionalMetadata?: Record<string, any>;
}
