import { Type, applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { SuccessResDto } from 'src/common/dto/success.res.dto';

// 참고: https://aalonso.dev/blog/how-to-generate-generics-dtos-with-nestjsswagger-422g
/**
 * 단일 데이터 공통 응답 스키마
 * @param resultDto
 * @returns
 */
export const ApiSuccessResponse = <ResultDto extends Type<unknown>>(
  resultDto: ResultDto,
) =>
  applyDecorators(
    ApiExtraModels(SuccessResDto, resultDto),
    ApiOkResponse({
      description: '성공 응답',
      schema: {
        allOf: [
          { $ref: getSchemaPath(SuccessResDto) },
          {
            properties: {
              result: { $ref: getSchemaPath(resultDto) },
            },
          },
        ],
      },
    }),
  );
