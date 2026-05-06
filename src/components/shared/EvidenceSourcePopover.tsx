import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DocumentSource, ExtractedValue } from "@/types/domain";

export function EvidenceSourcePopover({
  documents,
  value,
}: {
  documents: DocumentSource[];
  value?: ExtractedValue;
}) {
  const document = documents.find((item) => item.id === value?.sourceDocumentId);

  if (!value || !document) {
    return (
      <span className="text-xs font-medium text-rose-600 dark:text-rose-300">
        Missing evidence
      </span>
    );
  }

  return (
    <span className="group relative inline-flex">
      <Button variant="outline" size="sm" className="h-7 rounded-lg px-2 text-[11px]">
        <FileText className="h-3.5 w-3.5" />
        Source
      </Button>
      <span className="pointer-events-none absolute right-0 top-8 z-40 hidden w-80 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-2xl group-hover:block dark:border-slate-700 dark:bg-slate-950">
        <span className="mb-2 flex items-center justify-between gap-2">
          <span className="truncate text-xs font-semibold text-slate-900 dark:text-slate-50">
            {document.filename}
          </span>
          <Badge variant={document.credibilityTier === 1 ? "success" : "warning"}>
            Tier {document.credibilityTier}
          </Badge>
        </span>
        <span className="block text-xs text-slate-500 dark:text-slate-400">
          Page {value.sourcePageRef} / {document.sourceType}
        </span>
        <span className="mt-2 block border-l-2 border-blue-500 pl-2 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
          {value.sourceSnippet}
        </span>
      </span>
    </span>
  );
}
