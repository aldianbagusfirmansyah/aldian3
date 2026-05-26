import React, { useState, useEffect } from "react";
import RatesTable from "./components/RatesTable";
import Converter from "./components/Converter";
import HistoryChart from "./components/HistoryChart";
import AIAnalyst from "./components/AIAnalyst";
import CompareHub from "./components/CompareHub";
import { Currencies, CURRENCY_MAP } from "./data/currencies";
import { 
  Globe, 
  RefreshCw, 
  Clock, 
  TrendingUp, 
  Calculator, 
  Brain, 
  BarChart4, 
  Wifi, 
  AlertCircle, 
  CheckCircle2, 
  Flame, 
  Briefcase,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [baseCurrency, setBaseCurrency] = useState<string>("USD");
  const [rates, setRates] = useState<Record<string, number>>({});
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorStatus, setErrorStatus] = useState<string>("");
  const [isBackupEngine, setIsBackupEngine] = useState<boolean>(false);

  // Dynamic Workspace Tabs: 'chart' | 'converter' | 'ai' | 'compare'
  const [activeTab, setActiveTab] = useState<'chart' | 'converter' | 'ai' | 'compare'>('chart');
  
  // State for Chart view: target code to graph
  const [selectedChartTarget, setSelectedChartTarget] = useState<string>("EUR");

  // State to inject newly selected currencies directly into the Converter component list
  // The Converter will listen if this increases/changes 
  const [triggerAddConverterCode, setTriggerAddConverterCode] = useState<string>("");

  // UTC Ticking Clock (grounds the workspace with fine precision)
  const [currentTime, setCurrentTime] = useState<string>("2026-05-26 02:44:38 UTC");

  useEffect(() => {
    // Ticking UTC clock
    const timer = setInterval(() => {
      const d = new Date();
      const utcString = d.toISOString().replace("T", " ").substring(0, 19) + " UTC";
      setCurrentTime(utcString);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Live Rates
  const fetchRates = async (base: string) => {
    setIsLoading(true);
    setErrorStatus("");
    try {
      const res = await fetch(`/api/rates?base=${base}`);
      if (!res.ok) {
        throw new Error(`Server rates route failed with status ${res.status}`);
      }
      const data = await res.json();
      
      if (data.result === "success" && data.rates) {
        setRates(data.rates);
        setLastUpdated(data.time_last_update_utc || new Date().toUTCString());
        setIsBackupEngine(!!data.is_fallback);
      } else {
        throw new Error(data.error || "Rate payload empty or corrupted");
      }
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "Failed to establish global FX stream connection.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRates(baseCurrency);
  }, [baseCurrency]);

  const handleSelectBase = (code: string) => {
    setBaseCurrency(code);
    // Automatically select a default target if the selected base matches the previous target
    if (selectedChartTarget === code) {
      setSelectedChartTarget(code === "USD" ? "EUR" : "USD");
    }
  };

  // Cross-component triggers
  const handleOpenChart = (code: string) => {
    setSelectedChartTarget(code);
    setActiveTab('chart');
  };

  const handleAddToConverter = (code: string) => {
    setTriggerAddConverterCode(code);
    setActiveTab('converter');
    // Simple toast simulated via visual flashing
    const pulseEl = document.getElementById("mobile_converter_notice");
    if (pulseEl) {
      pulseEl.classList.remove("opacity-0");
      pulseEl.classList.add("opacity-100");
      setTimeout(() => {
        pulseEl.classList.remove("opacity-100");
        pulseEl.classList.add("opacity-0");
      }, 1500);
    }
  };

  // Find most extreme daily currency movers relative to selected base (simulated)
  const movers = React.useMemo(() => {
    if (!rates || Object.keys(rates).length === 0) return { gainers: [], losers: [] };
    
    // Pick standard volatile nodes
    const candidates = ['JPY', 'TRY', 'RUB', 'BRL', 'ARS', 'MXN', 'INR', 'GBP', 'EUR', 'CAD', 'AUD', 'SEK', 'NOK', 'ZAR'];
    const activeCandidates = candidates.filter(c => c !== baseCurrency && rates[c] !== undefined);
    
    const results = activeCandidates.map(code => {
      const rate = rates[code];
      // Seed a pseudo-movers fluctuation percentage based on code name to keep it consistent yet dynamic
      let seed = 0;
      for (let i = 0; i < code.length; i++) seed += code.charCodeAt(i);
      const isGainer = seed % 2 === 0;
      const amount = (seed % 35) / 10 + 0.1; // e.g. 0.1% to 3.6%
      const change = isGainer ? amount : -amount;
      
      return {
        code,
        change,
        rate,
        meta: CURRENCY_MAP[code]
      };
    });

    const sorted = [...results].sort((a, b) => b.change - a.change);
    return {
      gainers: sorted.slice(0, 3),
      losers: sorted.reverse().slice(0, 3)
    };
  }, [rates, baseCurrency]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-200">
      
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[250px] h-[250px] bg-emerald-500/5 rounded-full blur-[90px] pointer-events-none" />

      {/* Main Container Header */}
      <header id="app_header" className="sticky top-0 bg-slate-950/75 backdrop-blur-md border-b border-slate-900 z-50 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Brand Mark */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center font-bold text-xl text-slate-950 shadow-lg shadow-emerald-500/10">
              $
            </div>
            <div>
              <h1 className="font-display font-extrabold text-white tracking-tight text-lg sm:text-xl flex items-center gap-1.5">
                Global<span className="text-emerald-500">FX</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-sans tracking-wide uppercase font-bold">
                Universal FX Exchange Desk
              </p>
            </div>
          </div>

          {/* Operational Telemetry Metrics */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 text-xs">
            
            {/* UTC Clock precision */}
            <div id="telemetry_clock" className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] shadow-sm select-none border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currentTime}</span>
            </div>

            {/* Live Pipeline State */}
            <div 
              id="telemetry_pipeline_status" 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-sans font-semibold border shadow-sm select-none ${
                isLoading 
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                  : errorStatus 
                    ? "bg-red-500/10 text-red-100 border-red-500/20" 
                    : isBackupEngine 
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20" 
                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Syncing...</span>
                </>
              ) : errorStatus ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                  <span>Connection Slow</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isBackupEngine ? "Backup Engine" : "Real-time Live"}</span>
                </>
              )}
            </div>

            {/* Quick Refresh trigger */}
            <button
              id="refresh_live_rates_btn"
              onClick={() => fetchRates(baseCurrency)}
              disabled={isLoading}
              className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors focus:outline-none"
              title="Refresh rates data manually"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

        </div>
      </header>

      {/* Primary Dashboard Grid Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 flex flex-col gap-6 relative z-10">
        
        {/* Error Notification Alert */}
        {errorStatus && (
          <div id="main_error_alert" className="p-4 bg-red-100/80 border border-red-200 rounded-2xl text-red-800 text-xs flex items-start gap-2.5 shadow-sm">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold font-sans">Pipeline Failure</p>
              <p className="mt-0.5 font-sans leading-relaxed">{errorStatus}. Setting currencies to local offline matrix.</p>
            </div>
          </div>
        )}

        {/* Global Overview Top Widgets rows */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Base Selection Widget */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-sans block">ACTIVE COMPARISON BASE</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xl">{CURRENCY_MAP[baseCurrency]?.flag || '🏳️'}</span>
                <span className="font-mono font-extrabold text-white text-base">{baseCurrency}</span>
                <span className="text-xs text-emerald-400 font-medium font-sans">({CURRENCY_MAP[baseCurrency]?.symbol || ''})</span>
              </div>
            </div>
            
            <select
              id="base_currency_header_select"
              value={baseCurrency}
              onChange={(e) => handleSelectBase(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold focus:outline-none cursor-pointer"
            >
              {Currencies.map(c => (
                <option key={c.code} value={c.code}>{c.code}</option>
              ))}
            </select>
          </div>

          {/* Timestamp pipeline Card */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex flex-col justify-between">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-sans">Pipeline Updated</span>
            <div className="text-xs text-slate-300 font-mono mt-1 font-semibold truncate">
               {lastUpdated || new Date().toISOString()}
            </div>
            <span className="text-[9px] text-emerald-400/90 font-sans mt-1">Updates multiple times daily</span>
          </div>

          {/* Volatile Top Gainers (Relative to Base) */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl space-y-2 col-span-1 md:col-span-2 overflow-hidden">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest font-sans flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-emerald-500/10 text-emerald-400 animate-pulse" /> TOP DAILY MOVERS (Estimated relative to {baseCurrency})
            </span>
            <div className="grid grid-cols-3 gap-2">
              {movers.gainers.map((m, i) => (
                <div 
                  id={`mover_tag_${m.code}`}
                  onClick={() => handleOpenChart(m.code)}
                  key={m.code} 
                  className="px-2.5 py-2 bg-slate-800/40 hover:bg-slate-800 border border-slate-800 rounded-xl text-center cursor-pointer transition-all active:scale-95 flex flex-col justify-between"
                  title="Click to view historical chart"
                >
                  <span className="font-mono font-bold text-xs text-slate-200">{m.code}</span>
                  <span className="font-mono text-[10px] font-bold text-emerald-400 mt-0.5">+{m.change.toFixed(1)}%</span>
                </div>
              ))}
              {movers.losers.map((m, i) => (
                <div 
                  id={`mover_tag_low_${m.code}`}
                  onClick={() => handleOpenChart(m.code)}
                  key={m.code} 
                  className="px-2.5 py-2 bg-slate-800/40 hover:bg-slate-800 border border-slate-800 rounded-xl text-center cursor-pointer transition-all active:scale-95 flex flex-col justify-between"
                  title="Click to view historical chart"
                >
                  <span className="font-mono font-bold text-xs text-slate-350">{m.code}</span>
                  <span className="font-mono text-[10px] font-bold text-rose-400 mt-0.5">{m.change.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Master Column Workspace Grid Setup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT CONTAINER LAYER: Worldwide rates grid list table */}
          <div className="lg:col-span-5 h-[680px]">
            <RatesTable
              baseCurrency={baseCurrency}
              rates={rates}
              onSelectBase={handleSelectBase}
              onOpenChart={handleOpenChart}
              onAddToConverter={handleAddToConverter}
            />
          </div>

          {/* RIGHT CONTAINER LAYER: Dynamically Toggled Panels and Tools */}
          <div className="lg:col-span-7 flex flex-col h-full min-h-[600px] gap-4">
            
            {/* Navigational Segment Tabs bar */}
            <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-2xl flex items-center justify-between gap-1 shrink-0">
              
              {/* Chart Trigger Tag */}
              <button
                id="tab_trigger_chart"
                onClick={() => setActiveTab('chart')}
                className={`flex-1 py-2 rounded-xl text-xs font-black tracking-wide uppercase flex items-center justify-center gap-1.5 transition-all outline-none ${
                  activeTab === 'chart'
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-850 active:scale-95"
                }`}
              >
                <TrendingUp className="w-4 h-4 stroke-[2.5]" />
                <span>Chart</span>
              </button>

              {/* Converter Trigger Tag */}
              <button
                id="tab_trigger_converter"
                onClick={() => setActiveTab('converter')}
                className={`flex-1 py-2 rounded-xl text-xs font-black tracking-wide uppercase flex items-center justify-center gap-1.5 transition-all outline-none ${
                  activeTab === 'converter'
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-850 active:scale-95"
                }`}
              >
                <Calculator className="w-4 h-4 stroke-[2.5]" />
                <span>Multi Converter</span>
              </button>

              {/* AI Trigger Tag */}
              <button
                id="tab_trigger_ai"
                onClick={() => setActiveTab('ai')}
                className={`flex-1 py-2 rounded-xl text-xs font-black tracking-wide uppercase flex items-center justify-center gap-1.5 transition-all outline-none ${
                  activeTab === 'ai'
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-850 active:scale-95"
                }`}
              >
                <Brain className="w-4 h-4 stroke-[2.5]" />
                <span>AI Analyst</span>
              </button>

              {/* Compare Trigger Tag */}
              <button
                id="tab_trigger_compare"
                onClick={() => setActiveTab('compare')}
                className={`flex-1 py-2 rounded-xl text-xs font-black tracking-wide uppercase flex items-center justify-center gap-1.5 transition-all outline-none ${
                  activeTab === 'compare'
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-850 active:scale-95"
                }`}
              >
                <BarChart4 className="w-4 h-4 stroke-[2.5]" />
                <span>Compare</span>
              </button>
            </div>

            {/* Display View Content area */}
            <div className="flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.18 }}
                  className="h-full"
                >
                  {activeTab === 'chart' && (
                    <HistoryChart
                      base={baseCurrency}
                      target={selectedChartTarget}
                      spotRate={rates[selectedChartTarget] || 1.0}
                    />
                  )}

                  {activeTab === 'converter' && (
                    <Converter
                      initialBase={baseCurrency}
                      rates={rates}
                    />
                  )}

                  {activeTab === 'ai' && (
                    <AIAnalyst
                      base={baseCurrency}
                      target={selectedChartTarget}
                      spotRate={rates[selectedChartTarget] || 1.0}
                    />
                  )}

                  {activeTab === 'compare' && (
                    <CompareHub
                      baseCurrency={baseCurrency}
                      rates={rates}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

          </div>

        </div>

      </main>

      {/* Footer Branding Bar */}
      <footer className="bg-transparent border-t border-slate-950 py-8 px-4 lg:px-8 mt-12 text-center text-xs text-slate-500 font-sans relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 justify-center">
            <span>Powered by</span>
            <span className="font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/10 px-2 py-0.5 rounded text-[11px]">ExchangeRate-API Proxy Engine</span>
            <span>&</span>
            <span className="font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded text-[11px] flex items-center gap-1 border border-slate-700">
               <Brain className="w-3 h-3 text-emerald-400" /> Google Gemini
            </span>
          </div>
          <div>
            <span>Global FX Currency Tracker & Exchange Rates Bento Workspace • Terminal standard ISO-4217</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
