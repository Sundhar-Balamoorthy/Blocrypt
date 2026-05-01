"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  generateFeistelChallenge, 
  generateSDESChallenge,
  generatePRESENTChallenge,
  type Challenge,
  type PracticeBit 
} from "@/lib/practice";
import { PracticeBitDisplay } from "./practice-bit-display";
import { PracticeReferenceTables } from "./practice-reference-tables";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, RotateCcw, Lightbulb, Zap, Trophy } from "lucide-react";

export function WorksheetView({ cipher }: { cipher: "feistel" | "sdes" | "present" }) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [studentBits, setStudentBits] = useState<PracticeBit[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");

  const startNewChallenge = useCallback(() => {
    let newChallenge: Challenge;
    if (cipher === "feistel") {
      newChallenge = generateFeistelChallenge(difficulty);
    } else if (cipher === "sdes") {
      newChallenge = generateSDESChallenge(difficulty);
    } else {
      newChallenge = generatePRESENTChallenge(difficulty);
    }
    setChallenge(newChallenge);
    setStudentBits(new Array(newChallenge.answer.length).fill(-1));
    setShowFeedback(false);
    setShowHint(false);
  }, [cipher, difficulty]);

  useEffect(() => {
    startNewChallenge();
  }, [startNewChallenge]);

  const handleBitClick = (index: number) => {
    setStudentBits(prev => {
      const next = [...prev];
      // Toggle: -1 -> 1 -> 0 -> -1
      if (next[index] === -1) next[index] = 1;
      else if (next[index] === 1) next[index] = 0;
      else next[index] = -1;
      return next;
    });
    // Reset feedback when they start editing again
    if (showFeedback) setShowFeedback(false);
  };

  if (!challenge) return null;

  const isCompleted = challenge.hiddenIndices.every(idx => studentBits[idx] !== -1);
  const isCorrect = challenge.hiddenIndices.every(idx => studentBits[idx] === challenge.answer[idx]);

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
       {/* Difficulty & Controls */}
       <div className="flex items-center gap-4 flex-wrap">
          <div className="flex rounded-lg border border-border overflow-hidden bg-secondary/50 p-0.5">
             {(["easy", "medium", "hard"] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-4 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest transition-all rounded-md ${
                    difficulty === d 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {d}
                </button>
             ))}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={startNewChallenge} 
            className="gap-2 border-primary/20 hover:border-primary/50 text-xs font-mono"
          >
             <RotateCcw className="h-3.5 w-3.5" />
             Refresh Puzzle
          </Button>
       </div>

       <Card className="bg-card/40 border-dashed border-2 border-border/60 relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
             <Trophy className="w-64 h-64 rotate-12" />
          </div>

          <CardHeader className="pb-4">
             <div className="flex items-center justify-between">
                <CardTitle className="text-base font-mono flex items-center gap-2.5">
                   <div className="p-1.5 rounded-md bg-amber-500/10">
                      <Zap className="h-4 w-4 text-amber-500" />
                   </div>
                   Worksheet: {challenge.type === "round" ? "Single Round Output" : "Full Encryption"}
                </CardTitle>
                <div className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border uppercase tracking-widest">
                   {challenge.cipher}
                </div>
             </div>
             <CardDescription className="text-xs font-mono mt-2 leading-relaxed text-balance">
                {challenge.description}
             </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-10">
             {/* Given Information Panel */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-4 p-4 rounded-xl bg-secondary/30 border border-border/50 backdrop-blur-sm">
                   <span className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-widest font-bold">Given Parameters</span>
                   
                   {challenge.given.plaintext && (
                      <div className="flex flex-col gap-2">
                         <span className="text-[9px] font-mono text-muted-foreground/50">PLAINTEXT (8-BIT)</span>
                         <div className="flex gap-1.5">
                            {challenge.given.plaintext.map((b, i) => (
                               <div key={i} className="w-8 h-8 flex items-center justify-center rounded-md bg-secondary text-muted-foreground font-mono text-xs border border-border/30">{b}</div>
                            ))}
                         </div>
                      </div>
                   )}

                   {challenge.given.inputL && (
                      <div className="flex flex-col gap-3">
                         <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] font-mono text-muted-foreground/50">INPUT L</span>
                            <div className="flex gap-1.5">
                               {challenge.given.inputL.map((b, i) => (
                                  <div key={i} className="w-8 h-8 flex items-center justify-center rounded-md bg-[var(--bit-l)]/20 text-[var(--bit-l)] border border-[var(--bit-l)]/30 font-mono text-xs">{b}</div>
                               ))}
                            </div>
                         </div>
                         <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] font-mono text-muted-foreground/50">INPUT R</span>
                            <div className="flex gap-1.5">
                               {challenge.given.inputR.map((b, i) => (
                                  <div key={i} className="w-8 h-8 flex items-center justify-center rounded-md bg-[var(--bit-r)]/20 text-[var(--bit-r)] border border-[var(--bit-r)]/30 font-mono text-xs">{b}</div>
                               ))}
                            </div>
                         </div>
                      </div>
                   )}
                </div>

                <div className="flex flex-col gap-4 p-4 rounded-xl bg-secondary/30 border border-border/50 backdrop-blur-sm">
                   <span className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-widest font-bold">Secret Key Details</span>
                   {challenge.given.key !== undefined ? (
                      <div className="flex flex-col gap-2">
                         <span className="text-[9px] font-mono text-muted-foreground/50">
                            {Array.isArray(challenge.given.key) ? "ROUND KEYS" : "KEY VALUE"}
                         </span>
                         <div className="flex flex-wrap gap-2">
                            {Array.isArray(challenge.given.key) ? (
                               typeof challenge.given.key[0] === 'number' ? (
                                 (challenge.given.key as number[]).map((k, i) => (
                                    <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[var(--bit-key)]/10 border border-[var(--bit-key)]/30 text-[var(--bit-key)] font-mono text-xs font-bold">
                                       <span className="opacity-50 text-[10px]">K{i+1}:</span> {k}
                                    </div>
                                 ))
                               ) : (
                                  <div className="flex gap-1">
                                     {(challenge.given.key as any[]).map((b, i) => (
                                        <div key={i} className="w-6 h-6 flex items-center justify-center rounded bg-[var(--bit-key)] text-primary-foreground font-mono text-[10px]">{b}</div>
                                     ))}
                                  </div>
                               )
                            ) : (
                               <div className="px-3 py-2 rounded-md bg-[var(--bit-key)]/10 border border-[var(--bit-key)]/30 text-[var(--bit-key)] font-mono text-sm font-bold">
                                  K = {challenge.given.key}
                               </div>
                            )}
                         </div>
                      </div>
                   ) : (
                      <div className="flex items-center justify-center h-full min-h-[60px] text-[10px] font-mono text-muted-foreground/40 italic text-center px-4">
                         Not required for this step
                      </div>
                   )}
                   {challenge.given.rounds && (
                      <div className="flex items-center gap-2 mt-auto">
                         <span className="text-[9px] font-mono text-muted-foreground/50 uppercase">Total Rounds:</span>
                         <span className="text-xs font-mono font-bold text-foreground bg-accent px-2 py-0.5 rounded">{challenge.given.rounds}</span>
                      </div>
                   )}
                </div>
             </div>

             {/* Puzzle Input Area */}
             <div className="flex flex-col gap-4 p-6 rounded-2xl bg-primary/5 border border-primary/10 shadow-inner">
                <div className="flex items-center justify-between mb-2">
                   <span className="text-[11px] font-mono text-primary font-bold uppercase tracking-[0.2em]">Puzzle Result</span>
                   <span className="text-[9px] font-mono text-muted-foreground italic">Click bits marked with '?' to solve</span>
                </div>
                <PracticeBitDisplay 
                   bits={studentBits}
                   answer={challenge.answer}
                   hiddenIndices={challenge.hiddenIndices}
                   label="Your Result"
                   variant="f"
                   onBitClick={handleBitClick}
                   showFeedback={showFeedback}
                />
             </div>

             {/* Action Bar */}
             <div className="flex items-center gap-3 pt-6 border-t border-border/40">
                <Button 
                   onClick={() => setShowFeedback(true)} 
                   disabled={!isCompleted || showFeedback}
                   className="gap-2 px-6 h-10 font-mono text-xs uppercase tracking-wider font-bold transition-all active:scale-95"
                >
                   <CheckCircle2 className="h-4 w-4" />
                   Validate
                </Button>
                
                <Button 
                   variant="ghost" 
                   size="sm"
                   onClick={() => setShowHint(!showHint)}
                   className={cn(
                     "gap-2 text-[10px] font-mono uppercase tracking-widest font-bold",
                     showHint ? "text-amber-400" : "text-muted-foreground hover:text-foreground"
                   )}
                >
                   <Lightbulb className={cn("h-3.5 w-3.5", showHint && "fill-amber-400")} />
                   {showHint ? "Hide Hint" : "Hint"}
                </Button>
                
                <div className="ml-auto">
                  {showFeedback && isCorrect && (
                     <div className="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-500 font-mono text-xs font-bold animate-in fade-in slide-in-from-right-4">
                        <Trophy className="h-4 w-4" />
                        CRYPTO-MASTER! CORRECT.
                     </div>
                  )}
                  {showFeedback && !isCorrect && (
                     <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs font-bold animate-in shake">
                        Calculation error detected. Try again!
                     </div>
                  )}
                </div>
             </div>

             {showHint && (
                <div className="p-4 rounded-xl bg-amber-500/5 border-l-4 border-amber-500/40 text-[11px] font-mono text-amber-200/80 leading-relaxed animate-in slide-in-from-top-2">
                   <div className="flex items-center gap-2 mb-1.5 text-amber-400 font-bold uppercase text-[9px] tracking-widest">
                      <Lightbulb className="h-3 w-3" />
                      Pedagogical Hint
                   </div>
                   {challenge.hint}
                </div>
             )}
          </CardContent>
       </Card>

       {/* Reference Tables */}
       <PracticeReferenceTables cipher={cipher} />
    </div>
  );
}
