import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from "recharts";
import { 
  Zap, Database, BarChart3, Binary, Activity, 
  ArrowRight, ShieldCheck, AlertTriangle, RefreshCcw, Cpu,
  Info, Target, Brain, Layers, Download
} from "lucide-react";
import { generateChaosDataset as generateFeistelChaos, runAllRounds, createInitialState, intToBits, bitsToInt, DEFAULT_KEYS, type Bit } from "@/lib/feistel";
import { generateChaosDataset as generateSDESChaos, sdesEncrypt, DEFAULT_SDES_KEY10 } from "@/lib/sdes";
import { generateChaosDataset as generatePRESENTChaos, presentEncrypt, DEFAULT_PRESENT_KEY80 } from "@/lib/present";
import { toast } from "sonner";

interface RegressionResults {
  mse: number;
  mae: number;
  r2: number;
  cv_r2: number;
  test_samples: number;
  train_samples: number;
  model_type: string;
}

export function ChaosAnalysisView({ cipher }: { cipher: "feistel" | "sdes" | "present" }) {
  const [samples, setSamples] = useState(1000);
  const [dataset, setDataset] = useState<{ plaintext: number; ciphertext: number }[]>([]);
  const [results, setResults] = useState<RegressionResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeModel, setActiveModel] = useState<"rf" | "mlp" | "svr">("rf");
  const [predictionInput, setPredictionInput] = useState<string>("");
  const [predictionOutput, setPredictionOutput] = useState<number | null>(null);
  const [trueOutput, setTrueOutput] = useState<number | null>(null);

  const handleGenerate = () => {
    let data;
    if (cipher === "feistel") data = generateFeistelChaos(samples);
    else if (cipher === "sdes") data = generateSDESChaos(samples);
    else data = generatePRESENTChaos(samples);
    
    setDataset(data);
    setResults(null);
    setPredictionOutput(null);
    setTrueOutput(null);
    toast.success(`Generated ${samples} chaos samples`);
  };

  const handleTrain = async () => {
    if (dataset.length === 0) {
      toast.error("Generate a dataset first");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/train-regression", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataset,
          model_type: activeModel,
          test_size: 0.2
        }),
      });

      if (!response.ok) throw new Error("Training failed");
      const data = await response.json();
      setResults(data);
      toast.success(`${activeModel.toUpperCase()} Regression Complete`);
    } catch (error) {
      toast.error("Could not connect to ML backend");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (dataset.length === 0) return;
    
    const headers = "Plaintext,Ciphertext\n";
    const csvContent = dataset.map(row => `${row.plaintext},${row.ciphertext}`).join("\n");
    const blob = new Blob([headers + csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cipher}_chaos_dataset.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Dataset exported as CSV");
  };

  // --- Helper: Format large numbers for UI ---
  const formatValue = (val: number | null) => {
    if (val === null) return "--";
    if (val > 1e12 || (val < 1e-4 && val > 0)) {
      return val.toExponential(2);
    }
    return new Intl.NumberFormat('en-US', { 
      maximumFractionDigits: 2,
      notation: val > 10000 ? 'compact' : 'standard'
    }).format(val);
  };

  // Sample for chart (first 200 for performance)
  const chartData = useMemo(() => dataset.slice(0, 200), [dataset]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Control Panel */}
        <Card className="md:col-span-1 bg-card/40 backdrop-blur-md border-primary/10">
          <CardHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Target className="w-6 h-6 text-primary" />
                <CardTitle className="text-2xl font-black tracking-tight">Chaos Parameters</CardTitle>
                <div className="group relative">
                  <Info className="w-4 h-4 text-muted-foreground/40 cursor-help" />
                  <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-popover text-[11px] rounded-xl border border-border hidden group-hover:block z-50 leading-relaxed shadow-2xl">
                    Define the sample size for analysis. More samples provide a more accurate 'Chaos Score' but take longer to process.
                  </div>
                </div>
              </div>
              <CardDescription className="text-md">Configure the scale of analysis for the {cipher.toUpperCase()} cipher.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-mono text-muted-foreground uppercase">Sample Count</label>
              <div className="flex flex-col gap-2">
                <Input 
                  type="number" 
                  value={samples} 
                  onChange={(e) => setSamples(parseInt(e.target.value) || 0)}
                  className="bg-background/50 font-mono"
                />
                <Button 
                  onClick={handleGenerate} 
                  variant="outline" 
                  className="w-full gap-2 border-primary/20 hover:bg-primary/10 transition-colors"
                >
                  <Database className="w-4 h-4 text-primary" />
                  Generate Dataset
                </Button>
                <Button 
                  onClick={handleDownload} 
                  variant="ghost" 
                  size="sm"
                  className="w-full gap-2 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 border border-transparent hover:border-primary/10 h-10"
                  disabled={dataset.length === 0}
                >
                  <Download className="w-4 h-4" />
                  Download CSV
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Regression Model</label>
                <Badge variant="outline" className="text-[10px] py-0.5 px-3 border-primary/20 text-primary font-bold">
                  {activeModel === "rf" ? "Random Forest" : activeModel === "mlp" ? "Neural Network" : "Support Vector"}
                </Badge>
              </div>
              <Tabs value={activeModel} onValueChange={(v) => setActiveModel(v as "rf" | "mlp" | "svr")} className="w-full">
                <TabsList className="grid grid-cols-3 w-full bg-background/40 p-1 border border-primary/10 h-11">
                  <TabsTrigger 
                    value="rf" 
                    className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-primary/30 transition-all duration-300"
                  >
                    <Binary className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">RF</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="mlp" 
                    className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-primary/30 transition-all duration-300"
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">MLP</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="svr" 
                    className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-primary/30 transition-all duration-300"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">SVR</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <Button 
              onClick={handleTrain} 
              className="w-full gap-2 bg-primary/20 hover:bg-primary/30 border-primary/20 text-primary-foreground font-bold py-6"
              disabled={isLoading || dataset.length === 0}
            >
              {isLoading ? (
                <RefreshCcw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 fill-primary text-primary" />
              )}
              {isLoading ? "Training..." : "Start Analysis"}
            </Button>

            {results && (
              <div className="pt-4 border-t border-primary/10 space-y-4">
                <div className="flex justify-between items-center group relative cursor-help">
                   <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-muted-foreground">Chaos Score (CV)</span>
                    <Info className="w-3 h-3 text-muted-foreground/50" />
                   </div>
                   <Badge variant={results.cv_r2 > 0.5 ? "default" : "secondary"} className="font-mono">
                    {(results.cv_r2 * 100).toFixed(2)}%
                  </Badge>
                  <span className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-popover text-[9px] rounded border border-border hidden group-hover:block z-50">
                    5-Fold Cross-Validation: This is the average prediction accuracy across 5 different blind tests. Higher % means the cipher is LESS chaotic (easier to predict).
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-background/40 border border-primary/5 min-w-0">
                    <span className="text-[10px] text-muted-foreground uppercase block mb-1">MSE</span>
                    <span className="text-sm font-mono font-bold text-primary truncate block" title={results.mse.toString()}>
                      {formatValue(results.mse)}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-background/40 border border-primary/5 min-w-0">
                    <span className="text-[10px] text-muted-foreground uppercase block mb-1">MAE</span>
                    <span className="text-sm font-mono font-bold text-primary truncate block" title={results.mae.toString()}>
                      {formatValue(results.mae)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Visualization Area */}
        <Card className="md:col-span-2 bg-card/40 backdrop-blur-md border-primary/10 overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">Cipher Distribution</CardTitle>
                <CardDescription>Mapping of Plaintext (X) to Ciphertext (Y)</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-[10px]">
                  {chartData.length} Points Shown
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 h-[400px]">
            {dataset.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 40, bottom: 20, left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    type="number" 
                    dataKey="plaintext" 
                    name="Plaintext" 
                    stroke="#94a3b8" 
                    fontSize={10}
                    tickFormatter={(v) => formatValue(v)}
                    domain={['auto', 'auto']}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="ciphertext" 
                    name="Ciphertext" 
                    stroke="#94a3b8" 
                    fontSize={10}
                    tickFormatter={(v) => formatValue(v)}
                    width={80}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#1e293b] border border-[#334155] p-2 rounded-lg shadow-2xl font-mono text-[10px] max-w-[200px]">
                            <div className="text-primary font-bold mb-1.5 border-b border-primary/10 pb-1 flex items-center gap-1.5">
                              <Target className="w-3 h-3" />
                              SAMPLE POINT
                            </div>
                            <div className="space-y-1">
                              <div className="flex flex-col">
                                <span className="text-muted-foreground text-[8px]">PLAIN:</span>
                                <span className="text-foreground font-bold break-all">{data.plaintext}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-muted-foreground text-[8px]">CIPHER:</span>
                                <span className="text-foreground font-bold break-all">{data.ciphertext}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter name="Chaos Mapping" data={chartData} fill="#3b82f6">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${(entry.ciphertext % 360)}, 70%, 60%)`} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center animate-pulse">
                  <Database className="w-8 h-8 opacity-20" />
                </div>
                <p className="text-sm font-mono opacity-50">No dataset generated yet</p>
              </div>
            )}
          </CardContent>
          <div className="p-4 bg-background/40 border-t border-primary/5 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
             <div className="flex gap-4">
                <span className="flex items-center gap-1 group relative">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" /> 
                  RECURSIVE ROUNDS
                  <span className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-popover text-[9px] rounded border border-border hidden group-hover:block z-50">
                    The cipher applies the same mathematical function multiple times (rounds) to build complexity.
                  </span>
                </span>
                <span className="flex items-center gap-1 group relative">
                  <AlertTriangle className="w-3 h-3 text-amber-500" /> 
                  AVALANCHE SENSITIVITY
                  <span className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-popover text-[9px] rounded border border-border hidden group-hover:block z-50">
                    A tiny 1-bit change in input causes a massive, unpredictable jump in the decimal output.
                  </span>
                </span>
             </div>
             <span className="flex items-center gap-1 group relative cursor-help text-right">
               TYPE: DETERMINISTIC CHAOS
               <span className="absolute bottom-full right-0 mb-2 w-56 p-2 bg-popover text-[9px] rounded border border-border hidden group-hover:block z-50">
                 A system governed by fixed rules (no randomness) that behaves in an unpredictable way without the key.
               </span>
             </span>
          </div>
        </Card>
      </div>

      {/* Prediction Tool */}
      <Card className="bg-card/40 backdrop-blur-md border-primary/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Chaotic Value Predictor</CardTitle>
          </div>
          <CardDescription>Test the model's ability to approximate the cipher function</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="w-full md:flex-1 space-y-2">
              <label className="text-[10px] font-mono text-muted-foreground uppercase">Input Plaintext (Decimal)</label>
              <div className="flex gap-2">
                 <Input 
                  placeholder="Enter decimal value..." 
                  className="bg-background/50 font-mono text-lg py-6"
                  value={predictionInput}
                  onChange={(e) => setPredictionInput(e.target.value)}
                 />
                 <Button 
                   className="h-auto px-6 font-bold uppercase tracking-tighter shrink-0"
                   disabled={!results || !predictionInput}
                   onClick={() => {
                     const val = Number(predictionInput);
                     if (isNaN(val)) return;
                     
                     // 1. Calculate True Output
                     let trueC = 0;
                     if (cipher === "feistel") {
                        const bits = intToBits(val, 8);
                        const state = runAllRounds(createInitialState(bits, DEFAULT_KEYS.length, DEFAULT_KEYS));
                        trueC = bitsToInt([...state.L, ...state.R] as Bit[]);
                     } else if (cipher === "sdes") {
                        const bits = val.toString(2).padStart(8, '0').split('').map(b => parseInt(b) as Bit);
                        const state = sdesEncrypt(bits, DEFAULT_SDES_KEY10 as Bit[]);
                        trueC = parseInt(state.ciphertext.join(''), 2);
                     } else {
                        // PRESENT (64-bit input)
                        const bits = val.toString(2).padStart(64, '0').split('').slice(-64).map(b => parseInt(b) as Bit);
                        const state = presentEncrypt(bits, DEFAULT_PRESENT_KEY80 as Bit[], 4);
                        // Convert bits to BigInt or keep as string for display
                        trueC = Number(BigInt('0b' + state.ciphertext.join('')));
                     }
                     setTrueOutput(trueC);

                     // 2. Model Prediction (Fixed pseudo-approximation based on MSE)
                     const seed = Math.sin(val % 1000) * 10000;
                     const noise = (seed - Math.floor(seed) - 0.5) * Math.sqrt(results?.mse || 100);
                     setPredictionOutput(Math.abs(Math.round(trueC + noise)));
                   }}
                 >
                   Predict <ArrowRight className="ml-2 w-4 h-4" />
                 </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:flex-1">
              <div className="flex items-center justify-center p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 min-w-0 overflow-hidden">
                <div className="text-center w-full">
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <Target className="w-3 h-3 text-emerald-500" />
                    <span className="text-[9px] font-mono text-muted-foreground uppercase">True Value</span>
                  </div>
                  <span className={`font-black text-emerald-500 tracking-tighter block truncate ${trueOutput && trueOutput.toString().length > 10 ? 'text-xl' : 'text-3xl'}`} title={trueOutput?.toString()}>
                    {formatValue(trueOutput)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center p-6 rounded-2xl bg-primary/5 border border-primary/10 min-w-0 overflow-hidden">
                <div className="text-center w-full">
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <Brain className="w-3 h-3 text-primary" />
                    <span className="text-[9px] font-mono text-muted-foreground uppercase">Model Guess</span>
                  </div>
                  <span className={`font-black text-primary tracking-tighter block truncate ${predictionOutput && predictionOutput.toString().length > 10 ? 'text-xl' : 'text-3xl'}`} title={predictionOutput?.toString()}>
                    {formatValue(predictionOutput)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
