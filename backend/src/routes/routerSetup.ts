import { Router as ExpressRouter } from "express";
import extractFileRouter from "./extract/extractFile.ts";
import benchmarkRouter from "./benchmark/benchmark.ts";

import type { Application as ExpressApplication } from "express";

function setupExtractRoutes(app: ExpressApplication) {
    const extractRouter = ExpressRouter();
    extractRouter.use(extractFileRouter);
    app.use("/extract", extractRouter);
}

function setupBenchmarkRoutes(app: ExpressApplication) {
    const router = ExpressRouter();
    router.use(benchmarkRouter);
    app.use("/benchmark", router);
}
export function setupRoutes(app: ExpressApplication) {
    setupExtractRoutes(app);
    setupBenchmarkRoutes(app);
}
