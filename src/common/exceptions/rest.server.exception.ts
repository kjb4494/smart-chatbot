// src/common/exceptions/rest.exception.ts
import { HttpException } from '@nestjs/common';

export class RestServerException extends HttpException {
  constructor(message: string) {
    super(message, 500);
  }
}
