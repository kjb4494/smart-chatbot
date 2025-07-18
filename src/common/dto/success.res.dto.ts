import { ApiProperty } from '@nestjs/swagger';

export class SuccessResDto<T> {
  @ApiProperty({ example: 200, description: '상태코드' })
  status: number;
  @ApiProperty()
  result: T;
  @ApiProperty({ example: '성공', description: '메세지' })
  message: string;
  @ApiProperty({ example: new Date().toISOString(), description: '응답 시간' })
  timestamp: string;

  constructor(partial: Partial<SuccessResDto<T>>) {
    this.status = partial.status || 200;
    this.message = partial.message || '성공';
    this.result = partial.result !== undefined ? partial.result : ('ok' as T);
    this.timestamp = new Date().toISOString();
  }
}
