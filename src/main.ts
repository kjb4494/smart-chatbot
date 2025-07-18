import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { join } from 'path';
import * as process from 'process';
import { Logger } from 'winston';
import { AppModule } from './app.module';
import { RestExceptionFilter } from './common/exceptions/rest.exception.filter';

const IS_DEV_MODE = process.env.NODE_ENV === 'prod' ? false : true;

class Application {
  private DEV_MODE: boolean;
  private PORT: string;
  private LOGGER: Logger;
  private CORS_ORIGIN_LIST: string[];

  constructor(private server: NestExpressApplication) {
    this.server = server;

    this.DEV_MODE = IS_DEV_MODE;
    this.PORT = '3000';
    this.LOGGER = this.server.get<Logger>(WINSTON_MODULE_PROVIDER);
    this.CORS_ORIGIN_LIST = process.env.CORS_ORIGIN_LIST
      ? process.env.CORS_ORIGIN_LIST.split(',').map((origin) => origin.trim())
      : ['*'];
  }

  /**
   * 애플리케이션을 부팅합니다.
   */
  async bootstrap() {
    await this.setupGlobalConfig();
    await this.server.listen(this.PORT);
  }

  /**
   * 애플리케이션에 필요한 모든 전역 설정을 실행합니다.
   */
  private async setupGlobalConfig() {
    this.setupCors();
    this.setupGlobalInterceptor();
    this.setupGlobalPipes();
    this.setupGlobalFilters();
    // this.setupMVC();
    if (this.DEV_MODE) {
      this.setupSwagger();
    }
  }

  private setupGlobalInterceptor() {}

  // https://docs.nestjs.com/pipes
  private setupGlobalPipes() {
    this.server.useGlobalPipes(
      new ValidationPipe({
        transform: true,
      }),
    );
  }

  private setupCors() {
    this.server.enableCors({
      origin: this.CORS_ORIGIN_LIST,
      credentials: true,
    });
  }

  // https://docs.nestjs.com/exception-filters
  private setupGlobalFilters() {
    this.server.useGlobalFilters(new RestExceptionFilter(this.LOGGER));
  }

  // https://docs.nestjs.com/techniques/mvc
  private setupMVC() {
    this.server.useStaticAssets(join(__dirname, 'public'));
    this.server.setBaseViewsDir(join(__dirname, 'views'));
    this.server.setViewEngine('hbs');
  }

  // https://docs.nestjs.com/fundamentals/lifecycle-events
  private setupLifecycleEvents() {
    this.server.enableShutdownHooks();
  }

  // https://docs.nestjs.com/openapi/introduction
  private setupSwagger() {
    const options = new DocumentBuilder()
      .setTitle('SmartChatbot API')
      .setDescription('SmartChatbot API 문서입니다.')
      .setVersion('0.0.1')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(this.server, options);
    SwaggerModule.setup('docs', this.server, document);
  }

  /**
   * 애플리케이션 서버 시작 성공 로그
   */
  startLog() {
    this.LOGGER.info(`✅ Started Server[${process.env.NODE_ENV}]`);
    this.LOGGER.info(`✅ Server on port ${this.PORT}...`);
    if (this.DEV_MODE) {
      this.LOGGER.info('🚀 Running in development mode.');
    }
  }

  /**
   * 애플리케이션 서버 시작 에러 로그
   * @param error
   */
  errorLog(error: string) {
    this.LOGGER.error(`🆘 Server error ${error}`);
  }
}

/**
 * 서버를 실행하는 함수
 */
async function init() {
  const server = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: IS_DEV_MODE ? ['error'] : false,
  });
  // 요청 본문 최대 크기 설정
  server.use(bodyParser.json({ limit: '5mb' }));
  server.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));
  const app = new Application(server);
  try {
    await app.bootstrap();
    app.startLog();
  } catch (error) {
    app.errorLog(error);
  }
}

// 서버 실행
init().catch((err) => console.error(`[Init Error] ${err}`));
