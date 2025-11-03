export abstract class ExtractionStrategy {
  abstract name: string;

  abstract extract(fileText: string, schema: Record<string, any>): Promise<{
    extractedData: Record<string, any>;
    remainingKeysSchema: Record<string, any>;
  }>;

  subtractSchemaKeys(originalSchema: Record<string, any>, extractedSchema: Record<string, any>): Record<string, any> {
    const remainingKeysSchema: Record<string, any> = {};

    for (const key in originalSchema) {
      if (!(key in extractedSchema)) {
        remainingKeysSchema[key] = originalSchema[key];
      }
    }

    return remainingKeysSchema;
  }
}
