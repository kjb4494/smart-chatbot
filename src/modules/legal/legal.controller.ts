import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiSuccessSimpleRes } from 'src/common/decorators/docs/success.simple.res.decorator';
import { SuccessResDto } from 'src/common/dto/success.res.dto';
import { LegalUpsertReqDto } from './dto/req/legal.upsert.req.dto';
import { LegalService } from './legal.service';

@Controller('/api/v1/legal')
@ApiTags('판례')
export class LegalController {
  constructor(private readonly legalService: LegalService) {}

  @Post()
  @ApiOperation({
    summary: '판례 업데이트',
    description: '입력한 정보로 판례를 업데이트합니다.',
  })
  @ApiSuccessSimpleRes()
  async upsertLegal(@Body() reqDto: LegalUpsertReqDto) {
    await this.legalService.upsertLegal(reqDto);
    return new SuccessResDto<void>({});
  }
}
