import { Module } from '@nestjs/common';

import { PineconeModule } from '../pinecone/pinecone.module';
import { LegalController } from './legal.controller';
import { LegalService } from './legal.service';

@Module({
  imports: [PineconeModule],
  controllers: [LegalController],
  providers: [LegalService],
})
export class LegalModule {}
