import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Eye } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Result {
  label: string;
  pdf_path: string;
  extraction_schema: Record<string, any>;
  request_timestamp: number;
  response_timestamp: number;
}

interface ResultsListProps {
  results: Result[];
  onViewResult: (result: Result) => void;
}

export const ResultsList = ({ results, onViewResult }: ResultsListProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Results ({results.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {results.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No results yet. Upload a document or start a benchmark to see results.
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{result.label}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {result.pdf_path}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      Time Elapsed: {(result.response_timestamp) - (result.request_timestamp)}ms
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewResult(result)}
                    className="ml-4"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
