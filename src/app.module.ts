import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { utilities, WinstonModule } from 'nest-winston';
import * as path from 'path';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { LegalModule } from './modules/legal/legal.module';
import { PineconeModule } from './modules/pinecone/pinecone.module';
import { ServerModule } from './modules/server/server.module';
import { OpenaiModule } from './modules/openai/openai.module';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  utilities.format.nestLike('SmartChatbot-LOG', { prettyPrint: true }),
);

@Global()
@Module({
  imports: [
    // 환경파일 설정 모듈
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.join(process.cwd(), 'dist/config/.env.default'),
        path.join(process.cwd(), 'dist/config/.env.' + process.env.NODE_ENV),
      ],
    }),
    // 로그 설정 모듈
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          level: process.env.NODE_ENV === 'prod' ? 'info' : 'debug',
          format: logFormat,
        }),
        new winston.transports.DailyRotateFile({
          level: process.env.NODE_ENV === 'prod' ? 'info' : 'debug',
          filename: './logs/%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          format: logFormat,
          maxFiles: 90,
        }),
      ],
    }),
    PineconeModule,
    LegalModule,
    ServerModule,
    OpenaiModule,
  ],
})
export class AppModule {}
