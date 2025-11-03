import OpenAI from "openai";
import {
    Prompt,
    Model,
    CompletionArguments,
} from "./types.ts";

export interface ISdkService {
    name: string;
    readonly model: Model;

    getCompletionNextToken<T>(
        prompt: Prompt[],
        schema: Record<string, any> | null,
        temperature: number,
    ): Promise<T>;

    getModel(): Model;
}

export class OpenAISdkService implements ISdkService {
    name = "OpenAI";
    client: OpenAI;
    readonly model: Model = "gpt-5-mini";

    constructor(apiKey: string) {
        this.client = new OpenAI({ apiKey: apiKey });
    }

    private buildCompletionArgs(
        prompt: Prompt[],
        temperature: number,
        schema: Record<string, any>,
    ): CompletionArguments {
        const completionArgs: CompletionArguments = {
            model: this.model,
            temperature: temperature,
            input: prompt,
            reasoning: { "effort": "low" },
            text: {
                format: {
                    type: "json_schema" as const,
                    name: "name",
                    schema,
                    strict: true,
                },
            },
        };

        return completionArgs;
    }

    async getCompletionNextToken<T>(
        prompt: Prompt[],
        schema: Record<string, any>,
        temperature: number,
    ): Promise<T> {
        const completion = await this.client.responses.parse(
            this.buildCompletionArgs(prompt, temperature, schema),
        );

        return completion.output_parsed as T;
    }

    getModel(): Model {
        return this.model;
    }
}
