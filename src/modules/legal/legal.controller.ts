import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiSuccessSimpleRes } from 'src/common/decorators/docs/success.simple.res.decorator';
import { SuccessResDto } from 'src/common/dto/success.res.dto';
import {
  LegalQuestionReqDto,
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

  @Post('/question')
  @ApiOperation({
    summary: '법률 질문 답변',
    description:
      '법률 질문을 입력하면 관련 판례들을 검색하여 AI가 답변을 생성합니다.',
  })
  @ApiSuccessSimpleRes('result', 'object')
  async answerLegalQuestion(@Body() reqDto: LegalQuestionReqDto) {
    const result = await this.legalService.answerLegalQuestion(reqDto);
    return new SuccessResDto({
      result: {
        answer: result.answer,
        searchInfo: {
          query: result.searchQuery,
          filters: result.filters,
          totalResults: result.totalResults,
        },
        relatedCases: result.searchResults,
      },
    });
  }
}
