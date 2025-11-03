import { IAIService, AIService } from "./ai/index.ts";

class ServicesCollection {
    ai: IAIService;

    constructor(
        ai: IAIService,
    ) {
        this.ai = ai;
    }
}

const aiService: IAIService = new AIService();
export const servicesCollectionInstance = new ServicesCollection(
    aiService,
);
