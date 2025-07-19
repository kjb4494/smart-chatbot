import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

export class PineconeService {
  private readonly logger = new Logger(PineconeService.name);
  private pinecone: Pinecone;
  private openai: OpenAI;
  private indexName: string;

  constructor(private configService: ConfigService) {
    this.init();
  }

  private init() {
    const apiKey = this.configService.get<string>('PINECONE_KEY');

    if (!apiKey) {
      this.logger.warn(
        'PINECONE_KEY environment variable is not set. Pinecone features will not work.',
      );
      return;
    }

    this.pinecone = new Pinecone({
      apiKey: apiKey,
    });

    this.indexName = this.configService.get<string>(
      'PINECONE_INDEX_NAME',
      'smart-chatbot',
    );
    this.logger.log(`Pinecone initialized with index: ${this.indexName}`);
  }

  private initializeOpenAI() {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'OPENAI_API_KEY environment variable is not set. OpenAI features will not work.',
      );
      return;
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
    });
    this.logger.log('OpenAI initialized');
  }

  async upsertText(
    text: string,
    metadata: Record<string, any> = {},
  ): Promise<string> {
    if (!this.pinecone || !this.openai) {
      throw new Error(
        'Pinecone or OpenAI is not initialized. Please check your environment variables.',
      );
    }

    try {
      // 텍스트를 벡터로 변환
      const embedding = await this.getTextEmbedding(text);

      // 고유 ID 생성
      const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Pinecone에 벡터 저장
      const index = this.pinecone.index(this.indexName);
      await index.upsert([
        {
          id,
          values: embedding,
          metadata: {
            text,
            ...metadata,
            createdAt: new Date().toISOString(),
          },
        },
      ]);

      this.logger.log(`Text upserted successfully with ID: ${id}`);
      return id;
    } catch (error) {
      this.logger.error('Error upserting text to Pinecone:', error);
      throw error;
    }
  }

  async searchSimilarTexts(query: string, topK: number = 5): Promise<any[]> {
    if (!this.pinecone || !this.openai) {
      throw new Error(
        'Pinecone or OpenAI is not initialized. Please check your environment variables.',
      );
    }

    try {
      // 쿼리 텍스트를 벡터로 변환
      const queryEmbedding = await this.getTextEmbedding(query);

      // Pinecone에서 유사한 벡터 검색
      const index = this.pinecone.index(this.indexName);
      const searchResponse = await index.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
      });

      return searchResponse.matches.map((match) => ({
        id: match.id,
        score: match.score,
        text: match.metadata?.text,
        metadata: match.metadata,
      }));
    } catch (error) {
      this.logger.error('Error searching similar texts:', error);
      throw error;
    }
  }

  private async getTextEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      this.logger.error('Error getting text embedding:', error);
      throw error;
    }
  }

  async deleteText(id: string): Promise<void> {
    if (!this.pinecone) {
      throw new Error(
        'Pinecone is not initialized. Please check your environment variables.',
      );
    }

    try {
      const index = this.pinecone.index(this.indexName);
      await index.deleteOne(id);
      this.logger.log(`Text deleted successfully with ID: ${id}`);
    } catch (error) {
      this.logger.error('Error deleting text from Pinecone:', error);
      throw error;
    }
  }

  async batchUpsertTexts(
    data: Array<{ text: string; metadata?: Record<string, any> }>,
    options: { batchSize?: number; delay?: number } = {},
  ): Promise<{
    success: number;
    failed: number;
    results: Array<{ id?: string; error?: string }>;
  }> {
    if (!this.pinecone || !this.openai) {
      throw new Error(
        'Pinecone or OpenAI is not initialized. Please check your environment variables.',
      );
    }

    const { batchSize = 10, delay = 1000 } = options;
    const results: Array<{ id?: string; error?: string }> = [];
    let success = 0;
    let failed = 0;

    this.logger.log(
      `Starting batch upsert of ${data.length} items with batch size ${batchSize}`,
    );

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      this.logger.log(
        `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(data.length / batchSize)}`,
      );

      // 배치 내에서 병렬 처리
      const batchPromises = batch.map(async (item, index) => {
        try {
          const id = await this.upsertText(item.text, item.metadata);
          return { id };
        } catch (error) {
          this.logger.error(`Error in batch item ${i + index}:`, error);
          return { error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // 성공/실패 카운트
      batchResults.forEach((result) => {
        if (result.id) {
          success++;
        } else {
          failed++;
        }
      });

      // 배치 간 지연 (API 제한 방지)
      if (i + batchSize < data.length && delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    this.logger.log(
      `Batch upsert completed. Success: ${success}, Failed: ${failed}`,
    );
    return { success, failed, results };
  }
}
