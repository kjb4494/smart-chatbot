import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import OpenAI from 'openai';
import { RestServerException } from 'src/common/exceptions/rest.server.exception';
import { Logger } from 'winston';

@Injectable()
export class OpenaiService {
  private openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    this.init();
  }

  private init() {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.logger.debug(`OPENAI_API_KEY: ${apiKey}`);

    if (!apiKey) {
      this.logger.warn(
        'OPENAI_API_KEY environment variable is not set. OpenAI features will not work.',
      );
      return;
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
    });

    this.logger.info('OpenAI initialized');
  }

  public getOpenai() {
    if (!this.openai) {
      throw new RestServerException('OpenAI is not initialized');
    }
    return this.openai;
  }

  public async getTextEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      this.logger.error('Error getting text embedding:', error);
      throw new RestServerException('Error getting text embedding');
    }
  }
}
