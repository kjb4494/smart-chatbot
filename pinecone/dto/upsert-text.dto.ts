import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class UpsertTextDto {
  @ApiProperty({
    description: '저장할 텍스트 내용',
    example: '이것은 ChatGPT에 참고자료로 사용될 긴 텍스트입니다...',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({
    description: '텍스트와 함께 저장할 메타데이터',
    example: {
      title: '문서 제목',
      category: '기술문서',
      author: '작성자',
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
