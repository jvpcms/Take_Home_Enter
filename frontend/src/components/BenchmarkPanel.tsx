import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, PlayCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type BenchmarkFileResult = {
  type: "file_result";
  index: number;
  total: number;
  pdf_path: string;
  label: string;
  extraction_schema: Record<string, unknown>;
  processingTime: number;
  request_timestamp: number;
  response_timestamp: number;
};

type BenchmarkFileError = {
  type: "file_error";
  index: number;
  total: number;
  pdf_path: string;
  label: string;
  error: string;
  processingTime: number;
  request_timestamp: number;
  response_timestamp: number;
};

type BenchmarkSummary = {
  totalFiles: number;
  request_timestamp: number;
  response_timestamp: number;
};

type BenchmarkComplete = {
  type: "complete";
  message: string;
  summary: BenchmarkSummary;
};

type BenchmarkFatalError = {
  type: "error";
  message: string;
  timestamp: number;
};

type BenchmarkMessage =
  | BenchmarkFileResult
  | BenchmarkFileError
  | BenchmarkComplete
  | BenchmarkFatalError;

interface BenchmarkPanelProps {
  onBenchmarkResult: (result: BenchmarkMessage) => void;
  onBenchmarkStart?: () => void;
  apiEndpoint: string;
}

export const BenchmarkPanel = ({ onBenchmarkResult, onBenchmarkStart, apiEndpoint }: BenchmarkPanelProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [ws]);

  const startBenchmark = () => {
    // Clear results when benchmark starts
    if (onBenchmarkStart) {
      onBenchmarkStart();
    }

    try {
      // Convert http/https to ws/wss
      const wsEndpoint = apiEndpoint.replace(/^http/, "ws") + "/benchmark";
      const websocket = new WebSocket(wsEndpoint);

      websocket.onopen = () => {
        console.log("WebSocket connected");
        setIsRunning(true);
        toast({
          title: "Benchmark started",
          description: "Processing documents...",
        });
      };

      websocket.onmessage = (event) => {
        try {
          const result = JSON.parse(event.data);
          console.log("Benchmark result received:", result);
          if (result.type === "complete") {
            const totalTime = result.summary.response_timestamp - result.summary.request_timestamp;
            const averageTime = Math.round(totalTime / result.summary.totalFiles);
            toast({
              title: "Benchmark complete",
              description: `${result.summary.totalFiles} documents processed in ${totalTime}ms. Average: ${averageTime}ms`,
            });
          }
          else if (result.type === "file_result") {
            onBenchmarkResult(result);
          }
        } catch (error) {
          console.error("Failed to parse benchmark result:", error);
        }
      };

      websocket.onerror = (error) => {
        console.error("WebSocket error:", error);
        toast({
          title: "Connection error",
          description: "Failed to connect to benchmark service",
          variant: "destructive",
        });
        setIsRunning(false);
        setWs(null);
      };

      websocket.onclose = () => {
        console.log("WebSocket closed");
        setIsRunning(false);
        setWs(null);
      };

      setWs(websocket);
    } catch (error) {
      console.error("Failed to start benchmark:", error);
      toast({
        title: "Failed to start",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Benchmark
        </CardTitle>
        <CardDescription>
          Note: Benchmark results indicate time since the benchmark started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={startBenchmark}
          className="w-full"
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <Activity className="mr-2 h-4 w-4 animate-spin" />
              Benchmark Running...
            </>
          ) : (
            <>
              <PlayCircle className="mr-2 h-4 w-4" />
              Start Benchmark
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
