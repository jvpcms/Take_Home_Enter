import { WebSocketServer, WebSocket } from "ws";
import { createLogger } from "../utils/customLogger.ts";
import { extractionControllerInstance } from "../controllers/extractionController.ts";
import { getTimestamp } from "../utils/timestamp.ts";

const logger = createLogger("WebSocket");

export function setupWebSocketRoutes(wss: WebSocketServer) {
  wss.on("connection", (ws: WebSocket, req) => {
    // Parse the URL from the request
    const url = req.url || "";
    const pathname = url.split("?")[0]; // Get pathname without query string

    logger.info(`WebSocket connection attempt to: ${pathname}`);

    // Handle benchmark WebSocket connection
    if (pathname === "/benchmark") {
      logger.info("Benchmark WebSocket connection established");

      ws.on("error", (error) => {
        logger.error(`WebSocket error: ${error}`);
      });

      ws.on("close", () => {
        logger.info("Benchmark WebSocket connection closed");
      });

      // Start benchmark when connection is established
      const sendResult = (result: any) => {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(JSON.stringify(result));
          } catch (error) {
            logger.error(`Error sending WebSocket message: ${error}`);
          }
        }
      };

      // Run benchmark asynchronously
      extractionControllerInstance
        .benchmark(sendResult)
        .then((summary) => {
          // Send completion message with summary
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: "complete",
                message: "Benchmark completed",
                summary: summary,
              })
            );
            // Close connection after a short delay to ensure message is sent
            setTimeout(() => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.close();
              }
            }, 100);
          }
        })
        .catch((error) => {
          logger.error(`Benchmark error: ${error}`);
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: error instanceof Error ? error.message : "Benchmark failed",
                timestamp: getTimestamp(),
              })
            );
            ws.close();
          }
        });
    } else {
      logger.warn(`Unknown WebSocket path: ${pathname}`);
      ws.close(1008, "Unknown path");
    }
  });
}

