// src/common/exceptions/rest.exception.ts
import { HttpException } from '@nestjs/common';
import { ErrorCode, ErrorCodeKey } from './error.code.enum';

export interface RestExceptionResType {
  status: number;
  code: number;
  message: string;
  result?: any;
}

export class RestException extends HttpException {
  constructor(errorKey: ErrorCodeKey, result?: any) {
    const { status, code, message } = ErrorCode[errorKey];
    const response: RestExceptionResType = {
      status,
      code,
      message,
      result: result,
    };
    super(response, status);
  }
}
