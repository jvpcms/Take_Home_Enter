import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import http from "http";
import { WebSocketServer } from "ws";

import { setupRoutes } from "./routes/routerSetup.ts";
import { setupWebSocketRoutes } from "./routes/websocketSetup.ts";
import envConfig from "./envconfig/envconfig.ts";

import { createLogger } from "./utils/customLogger.ts";

import type { Application as ExpressApplication } from "express";

/**
 * Instantiate, setup routes and return express app object
 * @returns express app isntance
 */
function getExpressApp(): ExpressApplication {
    const app = express();

    // Configure CORS with explicit options
    app.use(cors({
        origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:8000'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    app.use(bodyParser.json({ limit: '50mb' })); // Increase limit for base64 files
    app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
    setupRoutes(app);

    return app;
}

/**
 * Start running express aplication
 */
async function start() {
    const app = getExpressApp();

    const httpPort = envConfig.httpPort();

    // Create HTTP server
    const server = http.createServer(app);

    // Create WebSocket server
    const wss = new WebSocketServer({ server });

    // Setup WebSocket routes
    setupWebSocketRoutes(wss);

    server.listen(httpPort, "0.0.0.0", () => {
        createLogger("Server").info(`Server running on port ${httpPort}`);
    });
}

start();
