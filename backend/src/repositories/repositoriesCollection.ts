import {
    IExtractionCacheRepository,
    ExtractionCacheRepository,
} from "./extractionCache.ts";

class RepositoriesCollection {
    extractionCache: IExtractionCacheRepository;

    constructor(
        extractionCache: IExtractionCacheRepository,
    ) {
        this.extractionCache = extractionCache;
    }
}

const extractionCacheRepository: IExtractionCacheRepository = new ExtractionCacheRepository();
export const repositoriesCollectionInstance = new RepositoriesCollection(
    extractionCacheRepository,
);
