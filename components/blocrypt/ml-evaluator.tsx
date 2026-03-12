"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Brain, BarChart3, CheckCircle2 } from "lucide-react";
import type { DatasetRow } from "@/lib/feistel";

interface MLEvaluatorProps {
  dataset: DatasetRow[];
}

interface MLMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  confusion_matrix: {
    tp: number;
    tn: number;
    fp: number;
    fn: number;
  };
  test_samples?: number;
  train_samples?: number;
}

const API_URL = "https://jubilant-trout-v6pxrjx775qrcxwjv-8000.app.github.dev";

export function MLEvaluator({ dataset }: MLEvaluatorProps) {
  const [training, setTraining] = useState(false);
  const [metrics, setMetrics] = useState<MLMetrics | null>(null);
  const [trainSize, setTrainSize] = useState(0.8);
  const [modelType, setModelType] = useState<"nb" | "lr">("nb");
  const [error, setError] = useState<string | null>(null);


  const handleTrain = useCallback(async () => {
    setTraining(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/train`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dataset,
          model_type: modelType,
          test_size: 1 - trainSize,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Training failed");
      }

      const result = await response.json();
      setMetrics(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Training error:", err);
    } finally {
      setTraining(false);
    }
  }, [dataset, trainSize, modelType]);

  const trainCount = metrics?.train_samples ?? Math.floor(dataset.length * trainSize);
  const testCount = metrics?.test_samples ?? (dataset.length - trainCount);

  return (
    <div className="flex flex-col gap-4">
      {/* Model Selection */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-mono text-muted-foreground">Model:</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setModelType("nb")}
            disabled={training}
            className={`px-3 py-1.5 text-xs font-mono rounded font-semibold transition-colors ${
              modelType === "nb"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            Naive Bayes
          </button>
          <button
            onClick={() => setModelType("lr")}
            disabled={training}
            className={`px-3 py-1.5 text-xs font-mono rounded font-semibold transition-colors ${
              modelType === "lr"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            Logistic Regr.
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs font-mono text-muted-foreground">
            Train/Test Split:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0.5}
              max={0.95}
              step={0.05}
              value={trainSize}
              onChange={(e) => setTrainSize(parseFloat(e.target.value))}
              disabled={training}
              className="w-24 h-1.5 bg-muted rounded accent-primary"
            />
            <span className="text-xs font-mono text-foreground w-20">
              {Math.round(trainSize * 100)}% train
            </span>
          </div>
        </div>

        <Button
          onClick={handleTrain}
          disabled={training || dataset.length < 10}
          className="gap-1.5"
          size="sm"
        >
          <Brain className="h-4 w-4" />
          {training ? "Training..." : "Train Model"}
        </Button>
      </div>

      {/* Data Split Info */}
      <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
        <span>
          Train: <span className="text-foreground font-bold">{trainCount}</span>
        </span>
        <span>
          Test: <span className="text-foreground font-bold">{testCount}</span>
        </span>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/15 border border-destructive/30">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div className="text-xs text-destructive font-mono">{error}</div>
        </div>
      )}

      {metrics && (
        <div className="flex flex-col gap-3">
          {/* Main Metrics Cards */}
          <div className="grid grid-cols-2 gap-2">
            <MetricCard
              label="Accuracy"
              value={metrics.accuracy}
              icon={<CheckCircle2 className="h-4 w-4" />}
            />
            <MetricCard
              label="F1 Score"
              value={metrics.f1}
              icon={<BarChart3 className="h-4 w-4" />}
            />
            <MetricCard
              label="Precision"
              value={metrics.precision}
              icon={<CheckCircle2 className="h-4 w-4" />}
            />
            <MetricCard
              label="Recall"
              value={metrics.recall}
              icon={<CheckCircle2 className="h-4 w-4" />}
            />
          </div>

          {/* Confusion Matrix */}
          <div className="flex flex-col gap-2 p-3 rounded-lg bg-secondary/30 border border-border">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              Confusion Matrix
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 rounded bg-[var(--bit-r)]/10 border border-[var(--bit-r)]/30">
                <div className="text-[10px] text-muted-foreground">TP</div>
                <div className="text-sm font-bold text-[var(--bit-r)]">
                  {metrics.confusion_matrix.tp}
                </div>
              </div>
              <div className="text-center p-2 rounded bg-destructive/10 border border-destructive/30">
                <div className="text-[10px] text-muted-foreground">FP</div>
                <div className="text-sm font-bold text-destructive">
                  {metrics.confusion_matrix.fp}
                </div>
              </div>
              <div className="text-center p-2 rounded bg-destructive/10 border border-destructive/30">
                <div className="text-[10px] text-muted-foreground">FN</div>
                <div className="text-sm font-bold text-destructive">
                  {metrics.confusion_matrix.fn}
                </div>
              </div>
              <div className="text-center p-2 rounded bg-[var(--bit-l)]/10 border border-[var(--bit-l)]/30">
                <div className="text-[10px] text-muted-foreground">TN</div>
                <div className="text-sm font-bold text-[var(--bit-l)]">
                  {metrics.confusion_matrix.tn}
                </div>
              </div>
            </div>
          </div>

          {/* Interpretation */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/30 border border-border">
            <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground font-mono">
              <p>
                The <span className="text-foreground font-bold">{modelType === "nb" ? "Naive Bayes" : "Logistic Regression"}</span> model achieves{" "}
                <span className="text-foreground font-bold">
                  {(metrics.accuracy * 100).toFixed(1)}%
                </span>{" "}
                accuracy distinguishing Feistel ciphertexts from random data
                using statistical features extracted from bit sequences.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
}

function MetricCard({ label, value, icon }: MetricCardProps) {
  return (
    <div className="flex flex-col gap-1 p-2 rounded-lg bg-secondary/40 border border-border">
      <div className="flex items-center gap-1.5">
        <div className="text-muted-foreground">{icon}</div>
        <span className="text-[10px] font-mono text-muted-foreground uppercase">
          {label}
        </span>
      </div>
      <div className="text-sm font-mono font-bold text-foreground">
        {(value * 100).toFixed(1)}%
      </div>
    </div>
  );
}
