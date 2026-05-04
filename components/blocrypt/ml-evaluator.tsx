"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
} from "@/components/blocrypt/ui/chart";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertCircle, Brain, BarChart3, CheckCircle2 } from "lucide-react";
import type { DatasetRow } from "@/lib/feistel";

interface MLEvaluatorProps {
  dataset: DatasetRow[];
  cipher?: "feistel" | "sdes" | "present";
}

interface RoundMetric {
  rounds: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  test_samples: number;
  avg_confidence: number;
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
  test_confidence_scores?: number[];
  round_metrics?: RoundMetric[];
}

const API_URL = "http://localhost:8000";

export function MLEvaluator({ dataset, cipher = "feistel" }: MLEvaluatorProps) {
  const [training, setTraining] = useState(false);
  const [metrics, setMetrics] = useState<MLMetrics | null>(null);
  const [trainSize, setTrainSize] = useState(0.8);
  const [modelType, setModelType] = useState<"rf" | "lr" | "mlp">("rf");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMetrics(null);
    setError(null);
  }, [dataset, cipher, modelType, trainSize]);


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
  const avgConfidence = metrics?.test_confidence_scores?.length
    ? metrics.test_confidence_scores.reduce((sum, value) => sum + value, 0) / metrics.test_confidence_scores.length
    : undefined;

  const roundMetricsChartData = metrics?.round_metrics?.map((roundMetric) => ({
    rounds: roundMetric.rounds,
    accuracy: Number((roundMetric.accuracy * 100).toFixed(1)),
    confidence: Number((roundMetric.avg_confidence * 100).toFixed(1)),
    errorRate: Number(((1 - roundMetric.accuracy) * 100).toFixed(1)),
  })) ?? [];

  return (
    <div className="flex flex-col gap-4">
      {/* Model Selection */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-mono text-muted-foreground">Model:</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setModelType("rf")}
            disabled={training}
            className={`px-3 py-1.5 text-xs font-mono rounded font-semibold transition-colors ${
              modelType === "rf"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            Random Forest
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
            Logistic Regression
          </button>
          <button
            onClick={() => setModelType("mlp")}
            disabled={training}
            className={`px-3 py-1.5 text-xs font-mono rounded font-semibold transition-colors ${
              modelType === "mlp"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            Multi Layer Perceptron
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
        <div className="flex items-start gap-2 p-3 rounded-lg bg-[#450a0a] border border-[#7f1d1d]">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div className="text-xs text-destructive font-mono">{error}</div>
        </div>
      )}

      {metrics && (
        <div className="flex flex-col gap-3">
          {/* Main Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
            {avgConfidence !== undefined && (
              <MetricCard
                label="Confidence"
                value={avgConfidence}
                icon={<CheckCircle2 className="h-4 w-4" />}
              />
            )}
          </div>

          {/* Confusion Matrix */}
          <div className="flex flex-col gap-2 p-3 rounded-lg bg-[#1e293b] border border-border">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              Confusion Matrix
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 rounded bg-emerald-500/10 border border-emerald-500/30">
                <div className="text-[10px] text-muted-foreground">TP</div>
                <div className="text-sm font-bold text-emerald-300">
                  {metrics.confusion_matrix.tp}
                </div>
              </div>
              <div className="text-center p-2 rounded bg-red-500/10 border border-red-500/30">
                <div className="text-[10px] text-muted-foreground">FP</div>
                <div className="text-sm font-bold text-red-300">
                  {metrics.confusion_matrix.fp}
                </div>
              </div>
              <div className="text-center p-2 rounded bg-red-500/10 border border-red-500/30">
                <div className="text-[10px] text-muted-foreground">FN</div>
                <div className="text-sm font-bold text-red-300">
                  {metrics.confusion_matrix.fn}
                </div>
              </div>
              <div className="text-center p-2 rounded bg-sky-500/10 border border-sky-500/30">
                <div className="text-[10px] text-muted-foreground">TN</div>
                <div className="text-sm font-bold text-sky-300">
                  {metrics.confusion_matrix.tn}
                </div>
              </div>
            </div>
          </div>

          {/* Round Metrics Chart */}
          {metrics.round_metrics && metrics.round_metrics.length > 0 && (
            <div className="p-3 rounded-lg bg-[#1e293b] border border-border">
              <div className="flex items-center justify-between mb-3 gap-4">
                <div>
                  <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                    Round-Based Performance
                  </div>
                  <div className="text-sm text-foreground/80 font-mono mt-1">
                    Plot showing accuracy, confidence, and error rate across round groups, so degradation is visible when performance drops.
                  </div>
                </div>
                <div className="text-xs font-mono text-muted-foreground">
                  Displayed values are percentage accuracy and error rate per round bucket.
                </div>
              </div>

              <ChartContainer
                config={{
                  accuracy: { label: "Accuracy", color: "#38bdf8" },
                  confidence: { label: "Avg Confidence", color: "#a78bfa" },
                  errorRate: { label: "Error Rate", color: "#fb7185" },
                }}
                className="h-72"
              >
                <LineChart data={roundMetricsChartData} margin={{ top: 8, right: 24, left: 0, bottom: 40 }}>
                  <CartesianGrid stroke="#334155" vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="rounds"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    axisLine={{ stroke: "#475569" }}
                    tickLine={false}
                    tickMargin={8}
                    label={{ value: "Rounds", position: "bottom", offset: 8, fill: "#94a3b8", fontSize: 11 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    axisLine={{ stroke: "#475569" }}
                    tickLine={false}
                    label={{ value: "% Accuracy", angle: -90, position: "insideLeft", fill: "#94a3b8", fontSize: 11 }}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <ChartLegend verticalAlign="top" />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="var(--color-accuracy)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "var(--color-accuracy)" }}
                    activeDot={{ r: 5 }}
                    name="Accuracy"
                  />
                  <Line
                    type="monotone"
                    dataKey="confidence"
                    stroke="var(--color-confidence)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "var(--color-confidence)" }}
                    activeDot={{ r: 5 }}
                    name="Avg Confidence"
                  />
                  <Line
                    type="monotone"
                    dataKey="errorRate"
                    stroke="var(--color-errorRate)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 4, fill: "var(--color-errorRate)" }}
                    activeDot={{ r: 5 }}
                    name="Error Rate"
                  />
                </LineChart>
              </ChartContainer>
            </div>
          )}

          {/* Interpretation */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-[#1e293b] border border-border">
            <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground font-mono">
              <p>
                The <span className="text-foreground font-bold">
                  {modelType === "rf" ? "Random Forest" : modelType === "mlp" ? "Multi Layer Perceptron" : "Logistic Regression"}
                </span> model achieves{" "}
                <span className="text-foreground font-bold">
                  {(metrics.accuracy * 100).toFixed(1)}%
                </span>{" "}
                accuracy distinguishing {cipher === "sdes" ? "S-DES" : cipher === "present" ? "PRESENT" : "Feistel"} ciphertexts from random data
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
    <div className="flex flex-col gap-1 p-2 rounded-lg bg-[#1e293b] border border-border">
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
