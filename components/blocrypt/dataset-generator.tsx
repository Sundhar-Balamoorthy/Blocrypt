"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type DatasetRow, generateDataset, datasetToCSV } from "@/lib/feistel";
import { generateSDESDataset } from "@/lib/sdes";
import type { SDESDatasetRow } from "@/lib/sdes";
import { generatePRESENTDataset } from "@/lib/present";
import type { PRESENTDatasetRow } from "@/lib/present";
import { MLEvaluator } from "./ml-evaluator";
import { Database, Download } from "lucide-react";

type AnyDatasetRow = DatasetRow | SDESDatasetRow | PRESENTDatasetRow;

interface DatasetGeneratorProps {
  cipher?: "feistel" | "sdes" | "present";
  keys?: number[];
  rounds?: number;
}

export function DatasetGenerator({ cipher = "feistel", keys, rounds }: DatasetGeneratorProps) {
  const [numSamples, setNumSamples] = useState(1000);
  const [dataset, setDataset] = useState<AnyDatasetRow[] | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = useCallback(() => {
    setGenerating(true);
    // Use a small timeout so UI updates before heavy computation
    setTimeout(() => {
      const data = cipher === "sdes"
        ? generateSDESDataset(numSamples)
        : cipher === "present"
          ? generatePRESENTDataset(numSamples, rounds)
          : generateDataset(numSamples, keys);
      setDataset(data);
      setGenerating(false);
    }, 50);
  }, [numSamples, keys, cipher, rounds]);

  const handleDownload = useCallback(() => {
    if (!dataset) return;
    const rows = dataset as DatasetRow[];
    const csv = datasetToCSV(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `blocrypt_${cipher}_dataset.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [dataset]);

  const validCount = dataset?.filter((r) => r.label === 1).length ?? 0;
  const noiseCount = dataset?.filter((r) => r.label === 0).length ?? 0;
  const preview = dataset?.slice(0, 8) ?? [];
  const pLen = preview[0]?.plaintext.length ?? 8;
  const cLen = preview[0]?.ciphertext.length ?? 8;
  const showScroll = pLen + cLen > 16;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label
            htmlFor="num-samples"
            className="text-xs font-mono text-muted-foreground"
          >
            Samples:
          </label>
          <Input
            id="num-samples"
            type="number"
            min={10}
            max={10000}
            step={100}
            value={numSamples}
            onChange={(e) => setNumSamples(Number(e.target.value))}
            className="w-28 h-8 font-mono text-sm"
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="gap-1.5"
          size="sm"
        >
          <Database className="h-4 w-4" />
          {generating ? "Generating..." : "Generate Dataset"}
        </Button>

        {dataset && (
          <Button
            onClick={handleDownload}
            variant="secondary"
            size="sm"
            className="gap-1.5"
          >
            <Download className="h-4 w-4" />
            Download CSV
          </Button>
        )}
      </div>

      {dataset && (
        <div className="flex flex-col gap-3">
          {/* Stats */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-muted-foreground">
              Total: <span className="text-foreground font-bold">{dataset.length}</span>
            </span>
            <span className="text-[var(--bit-r)]">
              Valid (1): <span className="font-bold">{validCount}</span>
            </span>
            <span className="text-destructive">
              Noise (0): <span className="font-bold">{noiseCount}</span>
            </span>
          </div>

          {/* Preview Table with Scroll Area if needed */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className={showScroll ? "overflow-x-auto max-w-full" : ""}>
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#334155]">
                    <TableHead className="font-mono text-[10px] py-2 px-2 sticky left-0 bg-[#334155]">
                      #
                    </TableHead>
                    {Array.from({ length: pLen }, (_, i) => (
                      <TableHead
                        key={`p${i}`}
                        className="font-mono text-[10px] text-[var(--bit-l)] py-2 px-1 text-center min-w-[24px]"
                      >
                        P{i}
                      </TableHead>
                    ))}
                    {Array.from({ length: cLen }, (_, i) => (
                      <TableHead
                        key={`c${i}`}
                        className="font-mono text-[10px] text-[var(--bit-f)] py-2 px-1 text-center min-w-[24px]"
                      >
                        C{i}
                      </TableHead>
                    ))}
                    {preview[0]?.rounds !== undefined && (
                      <TableHead className="font-mono text-[10px] py-2 px-2 text-center bg-[#334155]">
                        Rounds
                      </TableHead>
                    )}
                    <TableHead className="font-mono text-[10px] py-2 px-2 text-center sticky right-0 bg-[#334155]">
                      Label
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview?.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-[10px] text-muted-foreground py-1.5 px-2 sticky left-0 bg-card">
                        {i + 1}
                      </TableCell>
                      {row.plaintext.map((bit, j) => (
                        <TableCell
                          key={`p${j}`}
                          className="font-mono text-[10px] py-1.5 px-0.5 text-center text-foreground"
                        >
                          {bit}
                        </TableCell>
                      ))}
                      {row.ciphertext.map((bit, j) => (
                        <TableCell
                          key={`c${j}`}
                          className="font-mono text-[10px] py-1.5 px-0.5 text-center text-foreground"
                        >
                          {bit}
                        </TableCell>
                      ))}
                      {row.rounds !== undefined && (
                        <TableCell className="font-mono text-[10px] py-1.5 px-2 text-center text-foreground">
                          {row.rounds}
                        </TableCell>
                      )}
                      <TableCell
                        className={`font-mono text-[10px] py-1.5 px-2 text-center font-bold sticky right-0 bg-card ${
                          row.label === 1
                            ? "text-[var(--bit-r)]"
                            : "text-destructive"
                        }`}
                      >
                        {row.label}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="px-3 py-2 text-[10px] font-mono text-muted-foreground bg-[#1e293b] border-t border-border">
              Showing first {preview?.length} of {dataset.length} rows (Block: {pLen} bits)
            </div>
          </div>

          {/* ML Evaluator */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="mb-4">
              <h3 className="text-sm font-mono font-bold text-foreground">
                Machine Learning Evaluation
              </h3>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                Train a Machine Learning classifier to distinguish {cipher === "sdes" ? "S-DES" : cipher === "present" ? "PRESENT" : "Feistel"} ciphertexts
                from random data using statistical features.
              </p>
            </div>
            <MLEvaluator dataset={dataset as DatasetRow[]} cipher={cipher} />
          </div>
        </div>
      )}
    </div>
  );
}
