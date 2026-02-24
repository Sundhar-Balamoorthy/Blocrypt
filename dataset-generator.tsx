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
import { Database, Download } from "lucide-react";

export function DatasetGenerator() {
  const [numSamples, setNumSamples] = useState(1000);
  const [dataset, setDataset] = useState<DatasetRow[] | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = useCallback(() => {
    setGenerating(true);
    // Use a small timeout so UI updates before heavy computation
    setTimeout(() => {
      const data = generateDataset(numSamples);
      setDataset(data);
      setGenerating(false);
    }, 50);
  }, [numSamples]);

  const handleDownload = useCallback(() => {
    if (!dataset) return;
    const csv = datasetToCSV(dataset);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "blocrypt_feistel_dataset.csv";
    link.click();
    URL.revokeObjectURL(url);
  }, [dataset]);

  const validCount = dataset?.filter((r) => r.label === 1).length ?? 0;
  const noiseCount = dataset?.filter((r) => r.label === 0).length ?? 0;
  const preview = dataset?.slice(0, 8);

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

          {/* Preview Table */}
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead className="font-mono text-[10px] py-2 px-2">
                    #
                  </TableHead>
                  {Array.from({ length: 8 }, (_, i) => (
                    <TableHead
                      key={`p${i}`}
                      className="font-mono text-[10px] text-[var(--bit-l)] py-2 px-1.5 text-center"
                    >
                      P{i}
                    </TableHead>
                  ))}
                  {Array.from({ length: 8 }, (_, i) => (
                    <TableHead
                      key={`c${i}`}
                      className="font-mono text-[10px] text-[var(--bit-f)] py-2 px-1.5 text-center"
                    >
                      C{i}
                    </TableHead>
                  ))}
                  <TableHead className="font-mono text-[10px] py-2 px-2 text-center">
                    Label
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview?.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-[10px] text-muted-foreground py-1.5 px-2">
                      {i + 1}
                    </TableCell>
                    {row.plaintext.map((bit, j) => (
                      <TableCell
                        key={`p${j}`}
                        className="font-mono text-[10px] py-1.5 px-1.5 text-center text-foreground"
                      >
                        {bit}
                      </TableCell>
                    ))}
                    {row.ciphertext.map((bit, j) => (
                      <TableCell
                        key={`c${j}`}
                        className="font-mono text-[10px] py-1.5 px-1.5 text-center text-foreground"
                      >
                        {bit}
                      </TableCell>
                    ))}
                    <TableCell
                      className={`font-mono text-[10px] py-1.5 px-2 text-center font-bold ${
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
            <div className="px-3 py-2 text-[10px] font-mono text-muted-foreground bg-secondary/30 border-t border-border">
              Showing first {preview?.length} of {dataset.length} rows
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
