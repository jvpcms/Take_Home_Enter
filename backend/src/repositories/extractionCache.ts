import { v4 } from "uuid";
import crypto from "crypto";
import { IDatabase, getDatabase } from "../database/database.ts";

import type { extraction_cache } from "../database/types/extraction_cache.ts";
import { createLogger, ICustomLogger } from "../utils/customLogger.ts";

export interface IExtractionCacheRepository {
    /**
     * Creates a new extraction cache entry
     *
     * @param file_text The file text
     * @param extraction_key The extraction key
     * @param extracted_data The extracted data (will be serialized to JSON string)
     * @returns A promise that resolves to the created extraction cache
     */
    create(file_text: string, extraction_key: string, extracted_data: any): Promise<extraction_cache>;

    /**
     * Finds a extraction cache by its session ID, file hash and extraction key
     *
     * @param file_text The file text
     * @param extraction_key The extraction key
     * @returns A promise that resolves to the extraction cache if found, or null if not found
     */
    findByFileTextAndExtractionKey(file_text: string, extraction_key: string): Promise<extraction_cache | null>;
}

export class ExtractionCacheRepository implements IExtractionCacheRepository {
    private db: IDatabase;
    private readonly session_id: string;
    private readonly logger: ICustomLogger;

    constructor() {
        this.db = getDatabase();
        this.session_id = v4();
        this.logger = createLogger("ExtractionCacheRepository");
    }

    private hashFileContent(file_content: string): string {
        return crypto.createHash("sha256").update(file_content).digest("hex");
    }

    /**
     * Sanitizes a string by removing null bytes (0x00) which PostgreSQL doesn't allow in TEXT fields
     */
    private sanitizeString(str: string): string {
        return str.replace(/\0/g, '');
    }

    /**
     * Serializes extracted data to a JSON string and sanitizes it
     */
    private serializeExtractedData(data: any): string {
        // Serialize to JSON if not already a string
        const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
        // Remove null bytes that PostgreSQL doesn't allow
        return this.sanitizeString(jsonString);
    }

    async create(file_text: string, extraction_key: string, extracted_data: any): Promise<extraction_cache> {
        // Serialize and sanitize the extracted data
        const sanitizedData = this.serializeExtractedData(extracted_data);

        const extraction_cache: extraction_cache = {
            id: v4(),
            session_id: this.session_id,
            file_hash: this.hashFileContent(file_text),
            extraction_key,
            extracted_data: sanitizedData,
        };

        await this.db.insert("extraction_cache", extraction_cache);
        return extraction_cache;
    }

    async findByFileTextAndExtractionKey(file_text: string, extraction_key: string): Promise<extraction_cache | null> {
        const foundExtractionCache = await this.db.select(
            "extraction_cache",
            {
                session_id: this.session_id,
                file_hash: this.hashFileContent(file_text),
                extraction_key: extraction_key
            },
            { limit: 1 }
        );

        if (foundExtractionCache.length === 0) {
            return null;
        }

        return foundExtractionCache[0];
    }
}
