import { Prompt } from "./types.ts";
import { ISdkService } from "./sdk.ts";
import { OpenAISdkService } from "./sdk.ts";
import envConfig from "../../envconfig/envconfig.ts";
import { createLogger, ICustomLogger } from "../../utils/customLogger.ts";
import { AIQueueManager } from "./queueManager.ts";


export interface IAIService {
    getCompletion<T>(
        prompt: Prompt[],
        schema: Record<string, any>,
    ): Promise<T>;
}

export class AIService implements IAIService {
    aiSupplier: ISdkService;
    queueManager: AIQueueManager;
    logger: ICustomLogger;

    constructor() {
        const openAISdkService = new OpenAISdkService(envConfig.openAIServiceKey());
        this.aiSupplier = openAISdkService;
        this.logger = createLogger("AIService");
        this.queueManager = new AIQueueManager(this.aiSupplier, this.logger);
    }

    async getCompletion<T>(
        prompt: Prompt[],
        schema: Record<string, any>,
    ): Promise<T> {
        return this.queueManager.getCompletion<T>(
            prompt,
            schema,
        );
    }
}
