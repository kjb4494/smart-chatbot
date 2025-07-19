import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { PineconeService } from '../pinecone/pinecone.service';
import { LegalUpsertReqDto } from './dto/req/legal.upsert.req.dto';

@Injectable()
export class LegalService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly pineconeService: PineconeService,
  ) {}

  async upsertLegal(legal: LegalUpsertReqDto) {
    this.logger.info(`Upserting legal: ${legal.caseId}`);
    const pinecone = this.pineconeService.getPinecone();
  }
}
