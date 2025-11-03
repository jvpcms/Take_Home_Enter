import { ExtractionStrategy } from "./extractionStrategy.ts";
import { IExtractionCacheRepository } from "../repositories/extractionCache.ts";

export class CacheStrategy extends ExtractionStrategy {
  private extractionCacheRepository: IExtractionCacheRepository;
  name = "Cache Strategy";

  constructor(extractionCacheRepository: IExtractionCacheRepository) {
    super();
    this.extractionCacheRepository = extractionCacheRepository;
  }

  async extract(fileText: string, schema: Record<string, any>): Promise<{
    extractedData: Record<string, any>;
    remainingKeysSchema: Record<string, any>;
  }> {
    const schemaKeys = Object.keys(schema);
    const extractedData: Record<string, any> = {};

    for (const schemaKey of schemaKeys) {
      const cacheEntry = await this.extractionCacheRepository.findByFileTextAndExtractionKey(fileText, schemaKey);
      if (cacheEntry) {
        extractedData[schemaKey] = cacheEntry.extracted_data;
      }
    }
    const remainingKeysSchema = this.subtractSchemaKeys(schema, extractedData);
    return {
      extractedData,
      remainingKeysSchema
    };
  }
}