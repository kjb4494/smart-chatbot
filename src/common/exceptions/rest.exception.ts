// src/common/exceptions/rest.exception.ts
import { HttpException } from '@nestjs/common';
import { ErrorCode, ErrorCodeKey } from './error.code.enum';

export interface RestExceptionResType {
  status: number;
  code: number;
  message: string;
  detail?: any;
}

export class RestException extends HttpException {
  constructor(errorKey: ErrorCodeKey, detail?: any) {
    const { status, code, message } = ErrorCode[errorKey];
    const response: RestExceptionResType = {
      status,
      code,
      message,
      detail,
    };
    super(response, status);
  }
}
