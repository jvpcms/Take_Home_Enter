export type Prompt = (
    {
        role: "system";
        content: string;
    } | {
        role: "user";
        content: string;
    } | {
        role: "assistant";
        content: string;
    }
);

export type Model = "gpt-5-mini";

export type CompletionArguments = {
    model: Model;
    temperature: number;
    input: Prompt[];
    text: {
        format: {
            type: "json_schema";
            name: string;
            schema: Record<string, any>;
            strict: boolean;
        };
    };
    reasoning?: {
        effort: "low" | "high";
    } | null;
};
