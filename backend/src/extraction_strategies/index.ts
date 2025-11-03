import { ExtractionStrategy } from "./extractionStrategy.ts";
import { CacheStrategy } from "./cacheStrategy.ts";
import { repositoriesCollectionInstance } from "../repositories/repositoriesCollection.ts";
import { AIStrategy } from "./aiStrategy.ts";
import { servicesCollectionInstance } from "../services/servicesCollection.ts";

export const extractionStrategies: ExtractionStrategy[] = [
  new CacheStrategy(repositoriesCollectionInstance.extractionCache),
  new AIStrategy(servicesCollectionInstance.ai),
];