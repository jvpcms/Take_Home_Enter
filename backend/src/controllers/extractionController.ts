import fs from "fs"
import pdf from "pdf-parse-new";

import { serverErros, CustomError } from "../utils/customErrors.ts";
import { createLogger, ICustomLogger } from "../utils/customLogger.ts";
import { getTimestamp } from "../utils/timestamp.ts";

import type { IAIService } from "../services/ai/index.ts";
import { servicesCollectionInstance } from "../services/servicesCollection.ts";
import { extractionStrategies } from "../extraction_strategies/index.ts";
import { ExtractionStrategy } from "../extraction_strategies/extractionStrategy.ts";
import { IExtractionCacheRepository } from "../repositories/extractionCache.ts";
import { repositoriesCollectionInstance } from "../repositories/repositoriesCollection.ts";
import path from "path";
export interface IExtractionController {
    /**
     * Extracts data from a file
     *
     * @param fileText The text of the file to extract data from
     * @param schema The schema to use for extraction
     * @returns A promise that resolves to the extracted data
     */
    extract(fileText: string, schema: Record<string, any>): Promise<Record<string, any>>;

    /**
     * Benchmarks the extraction process
     *
     * @param onResult Optional callback function to send results as they are generated
     * @returns A promise that resolves to the benchmark result
     */
    benchmark(onResult?: (result: any) => void): Promise<Record<string, any>>;
}

class ExtractionController implements IExtractionController {
    private aiService: IAIService;
    private extractionStrategies: ExtractionStrategy[];
    private extractionCacheRepository: IExtractionCacheRepository;
    private logger: ICustomLogger;

    constructor(aiService: IAIService, extractionStrategies: ExtractionStrategy[], extractionCacheRepository: IExtractionCacheRepository) {
        this.aiService = aiService;
        this.extractionStrategies = extractionStrategies;
        this.extractionCacheRepository = extractionCacheRepository;
        this.logger = createLogger("ExtractionController");
    }

    async extract(fileText: string, schema: Record<string, any>): Promise<Record<string, any>> {
        const timestamp = getTimestamp();
        let answerObject: Record<string, any> = {};

        for (const strategy of this.extractionStrategies) {

            if (Object.keys(schema).length === 0) {
                break;
            }

            const { extractedData, remainingKeysSchema } = await strategy.extract(fileText, schema);
            answerObject = { ...answerObject, ...extractedData };
            schema = remainingKeysSchema;
        }

        for (const key of Object.keys(answerObject)) {
            const cacheEntry = await this.extractionCacheRepository.findByFileTextAndExtractionKey(fileText, key);
            if (!cacheEntry) {
                await this.extractionCacheRepository.create(fileText, key, answerObject[key]);
            }
        }

        this.logger.debug(`Time taken: ${getTimestamp() - timestamp}ms`);
        return answerObject;
    }

    private async benchmarkFile(onResult: (result: any) => void, ocrTask: any, index: number, totalFiles: number, startTime: number): Promise<void> {
        const benchmarkPath = path.join(process.cwd(), "benchmark");
        const filePath = path.join(benchmarkPath, "files", ocrTask.pdf_path);
        const pdfBuffer = fs.readFileSync(filePath);
        const pdfData = await pdf(pdfBuffer);
        const fileText = pdfData.text;

        const benchmarkResultsPath = path.join(process.cwd(), "benchmark", "results");
        try {
            if (!fs.existsSync(benchmarkResultsPath)) {
                fs.mkdirSync(benchmarkResultsPath, { recursive: true });
                this.logger.info(`Created benchmark results directory: ${benchmarkResultsPath}`);
            }
        } catch (dirError) {
            this.logger.error(`Failed to create benchmark results directory: ${dirError instanceof Error ? dirError.message : String(dirError)}`);
            throw dirError;
        }

        let result: any = null;

        try {
            const extractedData = await this.extract(fileText, ocrTask.extraction_schema);

            const endTime = getTimestamp();
            const processingTime = endTime - startTime;

            result = {
                type: "file_result",
                index: index + 1,
                total: totalFiles,
                pdf_path: ocrTask.pdf_path,
                label: ocrTask.label,
                extraction_schema: extractedData,
                processingTime: processingTime,
                request_timestamp: startTime,
                response_timestamp: getTimestamp(),
            };
        } catch (error) {
            const endTime = getTimestamp();
            const processingTime = endTime - startTime;
            result = {
                type: "file_error",
                index: index + 1,
                total: totalFiles,
                pdf_path: ocrTask.pdf_path,
                label: ocrTask.label,
                error: error instanceof Error ? error.message : "Unknown error",
                processingTime: processingTime,
                request_timestamp: startTime,
                response_timestamp: getTimestamp(),
            };
        } finally {
            if (result) {
                const benchmarkResultsFilePath = path.join(benchmarkResultsPath, `${ocrTask.pdf_path}.json`);
                fs.writeFileSync(benchmarkResultsFilePath, JSON.stringify(result, null, 2));
                onResult(result);
            } else {
                this.logger.error(`No result to save for ${ocrTask.pdf_path}`);
            }
        }
    }

    async benchmark(onResult?: (result: any) => void): Promise<Record<string, any>> {
        const benchmarkPath = path.join(process.cwd(), "benchmark");
        const benchmarkData = fs.readFileSync(path.join(benchmarkPath, "dataset.json"), "utf8");
        const benchmarkDataObject = JSON.parse(benchmarkData);
        const startTime = getTimestamp();

        const totalFiles = benchmarkDataObject.length;

        const promises = benchmarkDataObject.map((ocrTask: any, index: number) =>
            this.benchmarkFile(
                onResult ?? (() => { }),
                ocrTask,
                index,
                totalFiles,
                startTime
            )
        );

        await Promise.all(promises);

        return {
            totalFiles: totalFiles,
            request_timestamp: startTime,
            response_timestamp: getTimestamp(),
        };
    }
}

export const extractionControllerInstance = new ExtractionController(
    servicesCollectionInstance.ai,
    extractionStrategies,
    repositoriesCollectionInstance.extractionCache
);