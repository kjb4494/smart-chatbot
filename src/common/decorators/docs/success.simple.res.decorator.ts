import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';

/**
 * Swagger에서 성공 응답의 result 필드에 자유롭게 들어갈 경우의 스키마
 * @param result 기본값 "ok"
 * @param type 결과의 타입(기본값 string)
 */
export const ApiSuccessSimpleRes = (
  result: string | number | boolean | object = 'ok',
  type: 'string' | 'number' | 'boolean' | 'object' = 'string',
) =>
  applyDecorators(
    ApiOkResponse({
      description: 'Successful response',
      schema: {
        type: 'object',
        properties: {
          status: {
            type: 'number',
            example: 200,
          },
          result: {
            type: type,
            example: result,
          },
          message: {
            type: 'string',
            example: '성공',
          },
          timestamp: {
            type: 'string',
            example: new Date().toISOString(),
          },
        },
      },
    }),
  );
