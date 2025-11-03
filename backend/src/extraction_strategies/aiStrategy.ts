import { ExtractionStrategy } from "./extractionStrategy.ts";
import { IAIService } from "../services/ai/index.ts";
import { Prompt } from "../services/ai/types.ts";

export class AIStrategy extends ExtractionStrategy {
  name = "AI Strategy";
  private aiService: IAIService;

  constructor(aiService: IAIService) {
    super();
    this.aiService = aiService;
  }

  private convertSchemaToOpenAIFormat(schema: Record<string, any>): Record<string, any> {
    return {
      "type": "object",
      "properties": Object.fromEntries(
        Object.entries(schema).map(([key, value]) => [
          key,
          {
            "type": "string",
            "description": value
          }
        ])
      ),
      "required": Object.keys(schema),
      "additionalProperties": false
    };
  }

  private buildPrompt(userMessage: string): Prompt[] {
    return [
      {
        role: "system" as const,
        content: "Extract the data from the text and return a JSON object with the data."
      },
      {
        role: "user" as const,
        content: userMessage
      }
    ];
  }

  async extract(fileText: string, schema: Record<string, any>): Promise<{
    extractedData: Record<string, any>;
    remainingKeysSchema: Record<string, any>;
  }> {
    const openAIFormatSchema = this.convertSchemaToOpenAIFormat(schema);
    const prompt = this.buildPrompt(fileText);
    const extractedData = await this.aiService.getCompletion<Record<string, any>>(prompt, openAIFormatSchema);
    const remainingKeysSchema = this.subtractSchemaKeys(schema, extractedData);
    return {
      extractedData,
      remainingKeysSchema
    };
  }
}