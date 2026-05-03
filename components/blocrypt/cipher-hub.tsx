"use client";

import React, { useState } from "react";
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Shield, Cpu, Binary, Zap, Info, TrendingUp, 
  Map, Lightbulb, Play, ArrowRight, Target, Brain,
  Activity, Lock, Search, Database, Grid3X3, Home, ShieldCheck
} from "lucide-react";
import { 
  Radar, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip
} from "recharts";
import { toast } from "sonner";

// --- Data for Comparative Study ---
const COMPARATIVE_METRICS = [
  { metric: "Security", Feistel: 40, SDES: 65, PRESENT: 95 },
  { metric: "Speed", Feistel: 95, SDES: 70, PRESENT: 85 },
  { metric: "Complexity", Feistel: 50, SDES: 60, PRESENT: 90 },
];

const MODEL_PERFORMANCE = [
  { cipher: "Feistel", rf: 98, mlp: 92, svr: 85 },
  { cipher: "S-DES", rf: 95, mlp: 88, svr: 78 },
  { cipher: "PRESENT", rf: 65, mlp: 55, svr: 40 },
];

export function CipherHub({ onStartCipher }: { onStartCipher: (cipher: "feistel" | "sdes" | "present") => void }) {
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const tourSteps = [
    {
      title: "The Global Hub",
      description: "You are currently here. Use this dashboard to compare all algorithms at once using the 'Security Matrix' and trace the lineage of cryptography.",
      icon: <Home className="w-8 h-8 text-primary" />,
      color: "from-primary/20 to-transparent",
      cipher: null
    },
    {
      title: "Feistel Simulator (8-Bit)",
      description: "Classical block cipher structure. Highlight: Click the 'Feistel' tab at the top to experiment with rounds, subkeys, and L/R swaps.",
      icon: <Zap className="w-8 h-8 text-blue-500" />,
      color: "from-blue-500/20 to-transparent",
      cipher: "feistel"
    },
    {
      title: "S-DES Simulator (8-Bit)",
      description: "Advanced permutation logic. Highlight: Click the 'S-DES' tab to master P10/P8 permutations and S-Box lookups.",
      icon: <ShieldCheck className="h-8 w-8 text-emerald-500" />,
      color: "from-emerald-500/20 to-transparent",
      cipher: "sdes"
    },
    {
      title: "PRESENT Simulator (64-Bit)",
      description: "Modern Lightweight SPN. Highlight: Click the 'PRESENT' tab for high-performance 64-bit encryption analysis.",
      icon: <Grid3X3 className="w-8 h-8 text-purple-500" />,
      color: "from-purple-500/20 to-transparent",
      cipher: "present"
    }
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      
      {/* --- TOUR OVERLAY --- */}
      {isTourActive && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsTourActive(false)} />
          <Card className="relative z-[110] w-full max-w-lg border-primary/20 shadow-2xl animate-in slide-in-from-top-4 duration-500">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center mb-2">
                <Badge className="font-mono text-[10px] uppercase tracking-tighter">Guide: {tourSteps[tourStep].title}</Badge>
                <Badge variant="outline" className="font-mono text-[10px]">{tourStep + 1}/{tourSteps.length}</Badge>
              </div>
              <CardTitle className="text-2xl font-black">{tourSteps[tourStep].title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10">
                {tourSteps[tourStep].icon}
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {tourSteps[tourStep].description}
              </p>
              <div className="flex justify-between gap-4 pt-4 border-t border-border">
                <Button variant="ghost" onClick={() => setIsTourActive(false)}>Close</Button>
                <div className="flex gap-2">
                  {tourStep > 0 && <Button variant="outline" onClick={() => setTourStep(prev => prev - 1)}>Prev</Button>}
                  {tourStep < tourSteps.length - 1 ? (
                    <Button className="font-bold" onClick={() => setTourStep(prev => prev + 1)}>Next Step</Button>
                  ) : (
                    <Button className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setIsTourActive(false); setTourStep(0); }}>Finish & Explore</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* --- HERO SECTION --- */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card/80 to-background border border-primary/10 p-8 md:p-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <Badge variant="outline" className="px-4 py-1 border-primary/20 text-primary font-mono text-sm uppercase tracking-widest">
              The Hub
            </Badge>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight">
              Master the Art of <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Chaos</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
              Explore classical and modern ciphers. Compare their security, speed, and chaotic properties in one interactive dashboard.
            </p>
            <div className="flex gap-4 pt-4">
              <Button size="lg" variant="outline" className="rounded-full px-8 py-7 text-lg border-primary/20 hover:bg-primary/5 gap-2 font-bold" onClick={() => { setIsTourActive(true); setTourStep(0); }}>
                Take the Tour <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tourSteps.slice(1).map((step, i) => (
              <Card 
                key={i} 
                className={`bg-gradient-to-br ${step.color} border-primary/5 hover:border-primary/20 transition-all duration-300 group cursor-pointer hover:scale-[1.02] shadow-sm hover:shadow-xl`}
                onClick={() => onStartCipher(step.cipher as any)}
              >
                <CardContent className="p-6 space-y-4 text-center flex flex-col items-center">
                  <div className="p-4 rounded-3xl bg-background/50 w-fit group-hover:scale-110 transition-transform shadow-lg border border-primary/5">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* --- COMPARATIVE STUDY --- */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Grouped Bar Chart: Security Matrix */}
        <Card className="lg:col-span-2 bg-card/40 backdrop-blur-md border-primary/10">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                <CardTitle className="text-2xl font-bold tracking-tight">Security Matrix Comparison</CardTitle>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-xs font-bold">Feistel</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold">S-DES</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span className="text-xs font-bold">PRESENT</span>
                </div>
              </div>
            </div>
            <CardDescription className="text-md font-medium leading-relaxed">
              Comparing algorithms across normalized metrics (0-100). Higher scores indicate better performance in that category.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={COMPARATIVE_METRICS}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="metric" stroke="#94a3b8" fontSize={12} fontStyle="italic" />
                <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} />
                <ChartTooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px' }}
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                />
                <Bar dataKey="Feistel" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="SDES" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="PRESENT" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Algorithm Mapping / Lineage */}
        <Card className="bg-card/40 backdrop-blur-md border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Map className="w-6 h-6 text-primary" />
              <CardTitle className="text-xl">Algorithm Evolution</CardTitle>
            </div>
            <CardDescription className="text-md">Tracing the lineage of cryptosystems.</CardDescription>
          </CardHeader>
          <CardContent className="relative space-y-8 py-8">
            <div className="absolute left-[33px] top-12 bottom-12 w-[2px] bg-gradient-to-b from-blue-500 via-emerald-500 to-purple-500 opacity-20" />
            
            <div className="flex items-start gap-4 relative z-10 group cursor-default">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h4 className="font-bold text-lg">Feistel Networks</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">The foundation of block ciphers. Uses rounds and keys to split data. Leads directly to modern DES.</p>
                <Badge variant="outline" className="mt-2 text-[10px]">1970s ORIGIN</Badge>
              </div>
            </div>

            <div className="flex items-start gap-4 relative z-10 group cursor-default">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h4 className="font-bold text-lg">Simplified DES (S-DES)</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">A distilled version of Data Encryption Standard. Perfect for learning bit-level permutations.</p>
                <Badge variant="outline" className="mt-2 text-[10px]">EDUCATIONAL STANDARD</Badge>
              </div>
            </div>

            <div className="flex items-start gap-4 relative z-10 group cursor-default">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Grid3X3 className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h4 className="font-bold text-lg">SP-Networks (PRESENT)</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">Modern Substitution-Permutation design. Highly optimized for IoT and hardware.</p>
                <Badge variant="outline" className="mt-2 text-[10px]">MODERN LIGHTWEIGHT</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* --- BEST ML MODEL STUDY --- */}
      <section className="grid grid-cols-1 gap-8">
        <Card className="bg-card/40 backdrop-blur-md border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              <CardTitle className="text-2xl font-black tracking-tight">AI Attacker Performance Matrix</CardTitle>
            </div>
            <CardDescription className="text-md font-medium leading-relaxed">Evaluating which Machine Learning model is most effective at 'cracking' each algorithm's pattern.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MODEL_PERFORMANCE}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="cipher" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" unit="%" domain={[0, 100]} />
                <ChartTooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                />
                <Bar dataKey="rf" name="Random Forest" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="mlp" name="Neural Net (MLP)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="svr" name="SVM (SVR)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
          <div className="px-6 pb-8 text-sm text-muted-foreground flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <p className="leading-relaxed">
              <span className="font-bold text-foreground">Analysis:</span> Random Forest consistently performs best for structured bit-level data (Feistel/SDES), while modern SP-Networks like PRESENT successfully resist most shallow learning models.
            </p>
          </div>
        </Card>
      </section>

      {/* --- FOOTER FOOTNOTE --- */}
      <footer className="pt-12 text-center text-muted-foreground text-md font-mono opacity-50 pb-8 border-t border-border">
        BLOCRYPT V1.0 // BLOCK CIPHER CRYPTANALYSIS TOOL // DETERMINISTIC CHAOS PROJECT
      </footer>
    </div>
  );
}
