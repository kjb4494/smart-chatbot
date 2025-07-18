import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiSuccessSimpleRes } from 'src/common/decorators/docs/success.simple.res.decorator';
import { SuccessResDto } from 'src/common/dto/success.res.dto';

@Controller('/api/v1/server')
@ApiTags('서버 정보')
export class ServerController {
  @Get('/health')
  @ApiOperation({
    summary: '서버 헬스체크',
    description: '서버의 헬스체크를 조회합니다.',
  })
  @ApiSuccessSimpleRes()
  healthCheck(): SuccessResDto<void> {
    return new SuccessResDto({});
  }
}
