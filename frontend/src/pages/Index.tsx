import { useState } from "react";
import { ExtractForm } from "@/components/ExtractForm";
import { BenchmarkPanel } from "@/components/BenchmarkPanel";
import { ResultsList } from "@/components/ResultsList";
import { ResultModal } from "@/components/ResultModal";
import { FileSearch } from "lucide-react";

interface Result {
  label: string;
  pdf_path: string;
  extraction_schema: Record<string, unknown>;
  request_timestamp: number;
  response_timestamp: number;
}

const API_ENDPOINT = "http://localhost:8000"; // Update this with your backend URL

const Index = () => {
  const [results, setResults] = useState<Result[]>([]);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleExtractComplete = (result: Result) => {
    setResults((prev) => [{ ...result }, ...prev]);
  };

  const handleBenchmarkResult = (result: Result) => {
    setResults((prev) => [{ ...result }, ...prev]);
  };

  const handleClearResults = () => {
    setResults([]);
  };

  const handleViewResult = (result: Result) => {
    setSelectedResult(result);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileSearch className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">OCR Application</h1>
          </div>
          <p className="text-muted-foreground">
            Extract structured data from PDF documents
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ExtractForm
            onExtractComplete={handleExtractComplete}
            onExtractStart={handleClearResults}
            apiEndpoint={API_ENDPOINT}
          />
          <BenchmarkPanel
            onBenchmarkResult={handleBenchmarkResult}
            onBenchmarkStart={handleClearResults}
            apiEndpoint={API_ENDPOINT}
          />
        </div>

        <ResultsList results={results} onViewResult={handleViewResult} />

        <ResultModal
          result={selectedResult}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        />
      </div>
    </div>
  );
};

export default Index;
