import { useRef, useState, type ChangeEvent } from "react";
import { Download, FileUp, RotateCcw, UploadCloud } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  candidateToRecord,
  createCandidateCsvTemplate,
  parseImportedDataset,
  serializeCandidateRecordsAsCsv,
  serializeImportedDatasetAsJson,
} from "@/models/importData";
import { useDesignStore } from "@/stores/useDesignStore";

function downloadTextFile(fileName: string, content: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function DataImportPanel() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const results = useDesignStore((state) => state.results);
  const projectConstraints = useDesignStore((state) => state.projectConstraints);
  const importDataset = useDesignStore((state) => state.importDataset);
  const resetToMockData = useDesignStore((state) => state.resetToMockData);
  const dataSource = useDesignStore((state) => state.dataSource);
  const dataSourceLabel = useDesignStore((state) => state.dataSourceLabel);

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const payload = parseImportedDataset(file.name, text);
      importDataset(payload);
      setError(null);
      setMessage(`Imported ${payload.candidates.length} candidates from ${file.name}.`);
    } catch (importError) {
      setMessage(null);
      setError(importError instanceof Error ? importError.message : String(importError));
    }
  };

  const exportCurrentJson = () => {
    if (!results) {
      return;
    }

    const records = results.candidates.map(candidateToRecord);
    downloadTextFile(
      "facade-candidate-dataset.json",
      serializeImportedDatasetAsJson(records, projectConstraints),
      "application/json",
    );
  };

  const exportCurrentCsv = () => {
    if (!results) {
      return;
    }

    const records = results.candidates.map(candidateToRecord);
    downloadTextFile(
      "facade-candidate-dataset.csv",
      serializeCandidateRecordsAsCsv(records),
      "text/csv;charset=utf-8",
    );
  };

  const downloadTemplate = () => {
    downloadTextFile(
      "facade-candidate-template.csv",
      createCandidateCsvTemplate(),
      "text/csv;charset=utf-8",
    );
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <UploadCloud className="h-4 w-4 text-primary" />
          <span className="section-title">Import Your Data</span>
        </div>
        <CardTitle>Bring your own candidate dataset</CardTitle>
        <CardDescription>
          Import `.json` or `.csv` candidate pools, then keep using the current constraint sliders
          to filter feasibility and regenerate the Pareto set.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant={dataSource === "imported" ? "default" : "secondary"}>
            Source: {dataSource === "imported" ? "Imported dataset" : "Mock dataset"}
          </Badge>
          {dataSourceLabel ? <Badge variant="outline">{dataSourceLabel}</Badge> : null}
        </div>

        <div className="rounded-[1.35rem] border border-border/70 bg-slate-50/70 p-4">
          <p className="text-sm font-semibold text-slate-900">Accepted structure</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            JSON supports either an array of candidates or an object like{" "}
            <code className="rounded bg-white px-1.5 py-0.5 text-xs text-slate-800">
              {`{ "candidates": [...] }`}
            </code>
            . CSV supports flat columns like <code>materialType</code>, <code>cost</code>,{" "}
            <code>embodiedCarbon</code>, the 7 proxy fields, diagnostics, and panel metrics.
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.csv,application/json,text/csv"
          className="hidden"
          onChange={handleFileSelect}
        />

        <div className="grid gap-3 md:grid-cols-2">
          <Button onClick={() => fileInputRef.current?.click()}>
            <FileUp className="h-4 w-4" />
            Import JSON / CSV
          </Button>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4" />
            Download CSV template
          </Button>
          <Button variant="outline" onClick={exportCurrentJson} disabled={!results}>
            <Download className="h-4 w-4" />
            Export current JSON
          </Button>
          <Button variant="outline" onClick={exportCurrentCsv} disabled={!results}>
            <Download className="h-4 w-4" />
            Export current CSV
          </Button>
        </div>

        {dataSource === "imported" ? (
          <Button variant="secondary" className="w-full" onClick={resetToMockData}>
            <RotateCcw className="h-4 w-4" />
            Switch back to mock data
          </Button>
        ) : null}

        {message ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
