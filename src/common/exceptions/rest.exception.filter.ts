import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ErrorResDto } from '../dto/error.res.dto';
import { RestException, RestExceptionResType } from './rest.exception';

@Catch()
export class RestExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 에러 코드 예외 처리
    if (exception instanceof RestException) {
      const exceptionResponse = exception.getResponse() as RestExceptionResType;
      const payload = new ErrorResDto({
        code: exceptionResponse.code,
        message: exceptionResponse.message,
        detail: exceptionResponse.detail,
      });
      this.logger.debug(
        `[RestException] [${request.method}] ${request.originalUrl} (${exception.getStatus()})`,
        payload,
      );
      response.status(exception.getStatus()).json(payload);
      return;
    }

    // 비인증 예외 처리
    if (exception instanceof UnauthorizedException) {
      const exceptionResponse = exception.getResponse();
      const result =
        typeof exceptionResponse === 'object' ? exceptionResponse : {};
      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : 'Unauthorized Error.';
      const payload = new ErrorResDto({
        code: exception.getStatus(),
        message,
        detail: result,
      });
      this.logger.debug(
        `[UnauthorizedException] [${request.method}] ${request.originalUrl} (${exception.getStatus()})`,
        payload,
      );
      response.status(exception.getStatus()).json(payload);
      return;
    }

    // 입력값 검증 예외 처리
    if (exception instanceof BadRequestException) {
      const exceptionResponse = exception.getResponse();
      const payload = new ErrorResDto({
        code: 4009999,
        detail: {},
        message: 'Bad Reqeust',
      });
      // 실서버가 아니면 payload에도 상세 정보를 담아줌
      if (process.env.NODE_ENV !== 'prod') {
        switch (typeof exceptionResponse) {
          case 'object': {
            payload.detail = exceptionResponse;
            break;
          }
          case 'string': {
            payload.message = exceptionResponse;
            break;
          }
        }
      }
      // 요청값과 에러 상세결과 로깅
      this.logger.error(
        `[BadRequestException] [${request.method}] ${request.originalUrl} (${exception.getStatus()})`,
        {
          query: request.query,
          body: request.body,
          payload: payload,
          detail: exceptionResponse,
        },
      );
      response.status(exception.getStatus()).json(payload);
      return;
    }

    // 존재하지않는 API 경로 접근 예외 처리
    if (exception instanceof NotFoundException) {
      // 접근자 IP 로깅
      const clientIp =
        (request.headers['x-forwarded-for'] as string)?.split(',').shift() ||
        request.socket?.remoteAddress;
      this.logger.warn(
        `[NotFoundException] [${clientIp}] [${request.method}] ${request.originalUrl} (${exception.getStatus()})`,
      );

      // 간단한 에러메시지 응답
      const payload = new ErrorResDto({
        code: exception.getStatus(),
        message: 'API Not Found.',
        detail: {},
      });
      response.status(exception.getStatus()).json(payload);
      return;
    }

    // 상태코드 설정
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // 서버측 에러 예외 처리
    if (
      exception instanceof Error &&
      status === HttpStatus.INTERNAL_SERVER_ERROR
    ) {
      const message = exception.message;
      const stack = exception.stack;
      const payload = new ErrorResDto({
        code: 5009999,
        message: 'Internal Server Error.',
        detail: {},
      });
      this.logger.error(
        `[Internal Server Error] [${request.method}] ${request.originalUrl} (${status})`,
        {
          payload: payload,
          message: message,
          stack: stack,
        },
      );

      response.status(status).json(payload);
      return;
    }

    // 그 밖에 잘 모르겠지만 서버 잘못은 아닌듯한 예외 처리
    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Unknown Error.';

    const payload = new ErrorResDto({
      code: 4009998,
      detail: {},
      message: 'Unknown Error.',
    });
    this.logger.error(
      `[Unknown Exception] [${request.method}] ${request.originalUrl} (${status})`,
      {
        payload: payload,
        detail: exceptionResponse,
      },
    );
    response.status(status).json(payload);
  }
}
