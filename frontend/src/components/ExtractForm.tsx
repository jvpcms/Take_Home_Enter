import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExtractFormProps {
  onExtractComplete: (result: any) => void;
  onExtractStart?: () => void;
  apiEndpoint: string;
}

const EXAMPLE_SCHEMA = `{
  "label": "carteira_oab",
  "extraction_schema": {
    "nome": "Nome do profissional, normalmente no canto superior esquerdo da imagem",
    "inscricao": "Número de inscrição do profissional",
    "seccional": "Seccional do profissional",
    "subsecao": "Subseção à qual o profissional faz parte",
    "categoria": "Categoria, pode ser ADVOGADO, ADVOGADA, SUPLEMENTAR, ESTAGIARIO, ESTAGIARIA",
    "endereco_profissional": "Endereço do profissional",
    "telefone_profissional": "Telefone do profissional",
    "situacao": "Situação do profissional, normalmente no canto inferior direito."
  },
  "pdf_path": "oab_1.pdf"
}`;

export const ExtractForm = ({ onExtractComplete, onExtractStart, apiEndpoint }: ExtractFormProps) => {
  const [schema, setSchema] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      toast({
        title: "File selected",
        description: selectedFile.name,
      });
    } else {
      toast({
        title: "Invalid file",
        description: "Please select a PDF file",
        variant: "destructive",
      });
    }
  };

  const handleExtract = async () => {
    if (!file || !schema) {
      toast({
        title: "Missing information",
        description: "Please provide both a file and extraction schema",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    // Clear results when extraction starts
    if (onExtractStart) {
      onExtractStart();
    }

    try {
      // Parse schema
      const parsedSchema = JSON.parse(schema);

      // Convert file to base64 (chunked to avoid argument limit)
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const chunkSize = 8192; // Process in 8KB chunks
      let base64String = "";

      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, i + chunkSize);
        base64String += String.fromCharCode(...chunk);
      }

      const base64 = btoa(base64String);

      // Send to backend
      const response = await fetch(`${apiEndpoint}/extract`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schema: parsedSchema,
          file_base64: base64,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Extraction failed" }));
        throw new Error(errorData.message || "Extraction failed");
      }

      const result = await response.json();
      onExtractComplete(result.data);

      toast({
        title: "Extraction complete",
        description: "Document processed successfully",
      });

      // Reset form
      setFile(null);
      setSchema("");
      const fileInput = document.getElementById("file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Extraction error:", error);
      toast({
        title: "Extraction failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Extract Document
        </CardTitle>
        <CardDescription>
          Upload a PDF and provide an extraction schema to process the document
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label
            htmlFor="file-upload"
            className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {file ? file.name : "Click to upload PDF"}
              </span>
            </div>
            <input
              id="file-upload"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Extraction Schema</label>
          <Textarea
            placeholder={EXAMPLE_SCHEMA}
            value={schema}
            onChange={(e) => setSchema(e.target.value)}
            className="font-mono text-xs min-h-[300px]"
          />
        </div>

        <Button
          onClick={handleExtract}
          disabled={!file || !schema || isProcessing}
          className="w-full"
        >
          {isProcessing ? "Processing..." : "Extract Data"}
        </Button>
      </CardContent>
    </Card>
  );
};
