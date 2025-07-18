import { Type, applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { SuccessResDto } from 'src/common/dto/success.res.dto';

/**
 * 리스트 데이터 공통 응답 스키마
 */
export const ApiSuccessListResponse = <ResultDto extends Type<unknown>>(
  resultDto: ResultDto,
) =>
  applyDecorators(
    ApiExtraModels(SuccessResDto, resultDto),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(SuccessResDto) },
          {
            properties: {
              result: {
                type: 'array',
                items: { $ref: getSchemaPath(resultDto) },
              },
            },
          },
        ],
      },
    }),
  );
