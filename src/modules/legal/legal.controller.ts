import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiSuccessSimpleRes } from 'src/common/decorators/docs/success.simple.res.decorator';
import { SuccessResDto } from 'src/common/dto/success.res.dto';
import {
  LegalTextUpsertReqDto,
  LegalUpsertReqDto,
} from './dto/req/legal.upsert.req.dto';
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
  @ApiSuccessSimpleRes('vectorId', 'string')
  async upsertLegal(@Body() reqDto: LegalUpsertReqDto) {
    const vectorId = await this.legalService.upsertLegal(reqDto);
    return new SuccessResDto<string>({ result: vectorId });
  }

  @Post('/auto-parse')
  @ApiOperation({
    summary: '텍스트 자동 파싱 후 판례 저장',
    description:
      '텍스트나 JSON을 입력하면 OpenAI가 자동으로 분석하여 구조화된 판례 데이터로 저장합니다.',
  })
  @ApiSuccessSimpleRes('result', 'object')
  async upsertLegalFromText(@Body() reqDto: LegalTextUpsertReqDto) {
    const result = await this.legalService.upsertLegalFromText(reqDto);
    return new SuccessResDto({
      result: {
        vectorId: result.vectorId,
        message: '텍스트가 성공적으로 분석되어 저장되었습니다.',
        parsedData: result.parsedData,
      },
    });
  }
}
