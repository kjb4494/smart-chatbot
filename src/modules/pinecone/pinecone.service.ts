import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pinecone } from '@pinecone-database/pinecone';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { RestServerException } from 'src/common/exceptions/rest.server.exception';
import { Logger } from 'winston';

@Injectable()
export class PineconeService {
  private pinecone: Pinecone;
  private defaultIndexName: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    this.init();
  }

  private init() {
    const apiKey = this.configService.get<string>('PINECONE_API_KEY');
    this.logger.debug(`PINECONE_API_KEY: ${apiKey}`);
    if (!apiKey) {
      this.logger.warn(
        'PINECONE_API_KEY environment variable is not set. Pinecone features will not work.',
      );
      return;
    }

    this.pinecone = new Pinecone({
      apiKey: apiKey,
    });

    this.defaultIndexName = this.configService.get<string>(
      'PINECONE_DEFAULT_INDEX_NAME',
      'smart-chatbot',
    );

    this.logger.info(
      `Pinecone initialized with default index: ${this.defaultIndexName}`,
    );
  }

  public getPinecone() {
    if (!this.pinecone) {
      throw new RestServerException('Pinecone is not initialized');
    }
    return this.pinecone;
  }

  public getDefaultIndex() {
    return this.getPinecone().Index(this.defaultIndexName);
  }

  public getIndex(indexName: string) {
    return this.getPinecone().Index(indexName);
  }
}
