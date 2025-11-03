import PQueue from 'p-queue';
import envConfig from '../../envconfig/envconfig.ts';
import { serverErros } from '../../utils/customErrors.ts';

import type { Prompt } from './types.ts';
import type { ISdkService } from './sdk.ts';
import type { ICustomLogger } from '../../utils/customLogger.ts';

export class AIQueueManager {
  private queue: PQueue;
  private aiSupplier: ISdkService;
  private logger: ICustomLogger;

  constructor(aiSupplier: ISdkService, logger: ICustomLogger) {
    const concurrency = envConfig.aiConcurrencyLimit();

    this.queue = new PQueue({
      concurrency,
      interval: 1000,
      intervalCap: 10,
    });

    this.aiSupplier = aiSupplier;
    this.logger = logger;
  }

  async getCompletion<T>(
    prompt: Prompt[],
    schema: Record<string, any>
  ): Promise<T> {
    return this.queue.add(async () => {
      try {
        return await this.aiSupplier.getCompletionNextToken<T>(prompt, schema, 1);
      } catch (error) {
        this.logger.error(`Error from ${this.aiSupplier.name}: ${error}`);
        throw new serverErros.AIServiceError();
      }
    });
  }

  getQueueStats() {
    return {
      pending: this.queue.pending,
      size: this.queue.size,
    };
  }
}