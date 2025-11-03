import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Result {
  label: string;
  pdf_path: string;
  extraction_schema: Record<string, any>;
}

interface ResultModalProps {
  result: Result | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ResultModal = ({ result, open, onOpenChange }: ResultModalProps) => {
  if (!result) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{result.label}</DialogTitle>
          <DialogDescription>{result.pdf_path}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[500px]">
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(result.extraction_schema, null, 2)}
              </pre>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
