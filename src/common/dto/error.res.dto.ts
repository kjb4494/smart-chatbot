import { ApiProperty } from '@nestjs/swagger';

export class ErrorResDto {
  @ApiProperty({ example: 500, description: '상태코드' })
  code: number;

  @ApiProperty({ example: '실패', description: '에러 메세지' })
  message: string;

  @ApiProperty({
    example: '지정되지 않은 에러 메세지입니다.',
    description: '에러 결과 상세',
  })
  result: any;

  @ApiProperty({ example: new Date().toISOString(), description: '응답 시간' })
  timestamp: string;

  constructor(partial: Partial<ErrorResDto>) {
    this.code = partial.code ?? 500;
    this.message = partial.message ?? '실패';
    this.result = partial.result ?? null;
    this.timestamp = new Date().toISOString();
  }
}
