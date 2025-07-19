import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class BatchUpsertDto {
  @ApiProperty({
    description: '업로드할 데이터 배열',
    example: [
      {
        text: '사건명: 소유권이전등기\n사건번호: 90다4259\n...',
        metadata: {
          판례일련번호: 107597,
          사건번호: '90다4259',
          category: '판례',
        },
      },
    ],
  })
  @IsArray()
  @IsNotEmpty()
  data: Array<{
    text: string;
    metadata?: Record<string, any>;
  }>;

  @ApiPropertyOptional({
    description: '배치 처리 옵션',
    example: {
      batchSize: 10,
      delay: 1000,
    },
  })
  @IsOptional()
  @IsObject()
  options?: {
    batchSize?: number;
    delay?: number;
  };
}
