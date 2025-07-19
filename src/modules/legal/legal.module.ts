import { Module } from '@nestjs/common';

import { OpenaiModule } from '../openai/openai.module';
import { PineconeModule } from '../pinecone/pinecone.module';
import { LegalController } from './legal.controller';
import { LegalService } from './legal.service';

@Module({
  imports: [PineconeModule, OpenaiModule],
  controllers: [LegalController],
  providers: [LegalService],
})
export class LegalModule {}
