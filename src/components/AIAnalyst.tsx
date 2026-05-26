import React, { useState, useEffect } from "react";
import { Sparkles, Brain, ArrowRightCircle, RefreshCw, Send, AlertTriangle, ShieldAlert } from "lucide-react";
import { generateHistory } from "../utils/finance";

interface AIAnalystProps {
  base: string;
  target: string;
  spotRate: number;
}

export default function AIAnalyst({ base, target, spotRate }: AIAnalystProps) {
  const [analysis, setAnalysis] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  
  // Custom typewriter display state
  const [typedText, setTypedText] = useState<string>("");

  const handleRunAnalysis = async () => {
    setIsLoading(true);
    setErrorMsg("");
    setAnalysis("");
    setTypedText("");

    try {
      // slice a small sample of history coordinates for the analysis prompt context
      const sampleHistory = generateHistory(base, target, spotRate, 10).map(p => ({
        date: p.date,
        rate: p.rate
      }));

      const res = await fetch("/api/analyze-pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base,
          target,
          rate: spotRate,
          history: sampleHistory
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned error status ${res.status}`);
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysis(data.analysis || "No response received.");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred during analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  // Run automatically when currency pair changes
  useEffect(() => {
    handleRunAnalysis();
  }, [base, target, spotRate]);

  // Smooth Typewriter effect for AI responses
  useEffect(() => {
    if (!analysis) {
      setTypedText("");
      return;
    }

    let currentIndex = 0;
    const intervalTime = Math.max(1, Math.min(10, Math.floor(200 / analysis.length))); // Dynamic speed
    
    // Quick burst printing of analysis so user doesn't wait minutes for large copy
    const chunk_size = Math.ceil(analysis.length / 150); 
    
    const timer = setInterval(() => {
      currentIndex += chunk_size;
      if (currentIndex >= analysis.length) {
        setTypedText(analysis);
        clearInterval(timer);
      } else {
        setTypedText(analysis.slice(0, currentIndex));
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [analysis]);

  // Simple clean parser to render basic markdown elements as clean stylized HTML
  const renderParsedHTML = (raw: string) => {
    if (!raw) return null;
    
    const lines = raw.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      
      // Headers ###
      if (trimmed.startsWith("###")) {
        return (
          <h4 key={idx} className="text-sm font-bold text-emerald-400 mt-6 mb-2 flex items-center gap-2 border-b border-slate-800 pb-1 font-sans">
            {trimmed.replace(/^###\s*/, "")}
          </h4>
        );
      }
      
      // List points - or *
      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        const content = trimmed.replace(/^[-*]\s*/, "");
        return (
          <ul key={idx} className="list-disc list-inside text-xs text-slate-350 space-y-1 pl-2 my-1 font-sans leading-relaxed">
            <li>{parseInlineBold(content)}</li>
          </ul>
        );
      }

      // Ordered list points (e.g. 1. 2.)
      if (/^\d+\.\s+/.test(trimmed)) {
        const content = trimmed.replace(/^\d+\.\s+/, "");
        return (
          <ol key={idx} className="list-decimal list-inside text-xs text-slate-350 pl-2 my-1.5 font-sans leading-relaxed">
            <li>{parseInlineBold(content)}</li>
          </ol>
        );
      }

      // Empty spacers
      if (trimmed === "") {
        return <div key={idx} className="h-2" />;
      }

      // Standard paragraphs
      return (
        <p key={idx} className="text-xs text-slate-300 leading-relaxed font-sans mt-1.5">
          {parseInlineBold(trimmed)}
        </p>
      );
    });
  };

  // Helper to render bold strings internally (e.g. **text**)
  const parseInlineBold = (txt: string) => {
    const parts = txt.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, i) => {
      // Odd indices represent the bolded matches
      if (i % 2 === 1) {
        return <strong key={i} className="font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/10 px-1.5 py-0.5 rounded">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div id="ai_analyst_panel" className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl overflow-hidden flex flex-col h-full min-h-[500px]">
      
      {/* Station Header */}
      <div className="p-5 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Brain className="w-5 h-5 animate-pulse text-emerald-400" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-sm tracking-wide text-white flex items-center gap-1.5">
              Gemini AI Analyst Hub <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
            </h3>
            <p className="text-[10px] text-slate-400 font-sans mt-0.5">
              Live FX desk report for <strong className="text-emerald-450">{base} to {target}</strong>
            </p>
          </div>
        </div>

        <button
          id="trigger_ai_analysis_btn"
          onClick={handleRunAnalysis}
          disabled={isLoading}
          className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 active:scale-95 disabled:opacity-50 text-xs font-bold text-slate-200 rounded-xl flex items-center gap-1.5 transition-all outline-none border border-slate-750/50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Recalculate
        </button>
      </div>

      {/* Terminal Board Workspace */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[500px]">
        {isLoading ? (
          /* Loading Skeletal pulse indicators */
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-slate-800 rounded-full animate-bounce" />
              <span className="text-xs text-slate-400 font-mono italic">AI Analyst is calculating spot metrics...</span>
            </div>
            <div className="space-y-2 pl-10">
              <div className="h-3 w-5/6 bg-slate-800 rounded animate-pulse" />
              <div className="h-3 w-full bg-slate-800 rounded animate-pulse" />
              <div className="h-3 w-4/6 bg-slate-800 rounded animate-pulse" />
              <div className="h-3 w-5/6 bg-slate-800 rounded animate-pulse" />
            </div>
          </div>
        ) : errorMsg ? (
          /* Error report card */
          <div id="ai_error_card" className="p-5 bg-red-950/30 border border-red-800/40 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-red-400">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span className="font-sans font-semibold text-sm">Analysis Generation Paused</span>
            </div>
            <p className="text-xs text-red-300 font-sans leading-relaxed">
              {errorMsg}. Make sure to set a valid <strong>GEMINI_API_KEY</strong> environment variable to provision live sentiment reports directly from our servers!
            </p>
          </div>
        ) : typedText ? (
          /* Main Analytical Report */
          <div id="ai_analysis_report" className="bg-slate-950/20 border border-slate-800/80 rounded-2xl p-5 space-y-4 text-slate-300 shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                <span className="font-mono text-[9px] text-emerald-400 tracking-widest font-bold">RESEARCH STATEMENT</span>
              </div>
              <span className="text-[9px] text-slate-500 font-mono">MODEL: GEMINI-3.5-FLASH</span>
            </div>
            
            <div className="space-y-1">
              {renderParsedHTML(typedText)}
            </div>
          </div>
        ) : (
          /* Warm initialization screen */
          <div className="py-20 text-center flex flex-col items-center justify-center max-w-sm mx-auto">
            <Sparkles className="w-10 h-10 text-emerald-400 stroke-1 animate-pulse mb-3" />
            <h4 className="font-sans font-bold text-white text-sm">Request Macro Insights</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Unlock a structured outline analyzing base country inflationary trends, target commodities demands, of historical peaks of {base}/{target}.
            </p>
            <button
              id="analyze_now_btn"
              onClick={handleRunAnalysis}
              className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black rounded-xl transition-all active:scale-95"
            >
              Generate AI Document
            </button>
          </div>
        )}
      </div>

      {/* Workspace Footer disclaimer */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-[9px] text-slate-500 font-mono">
        <span>© Currency Tracker Intelligence Desk</span>
        <span>Past performance does not predict future returns</span>
      </div>
    </div>
  );
}
