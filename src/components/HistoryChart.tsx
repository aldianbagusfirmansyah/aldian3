import React, { useState, useMemo } from "react";
import { generateHistory } from "../utils/finance";
import { CURRENCY_MAP } from "../data/currencies";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Calendar, RefreshCw, AlertCircle, Info, Flame } from "lucide-react";

interface HistoryChartProps {
  base: string;
  target: string;
  spotRate: number;
}

export default function HistoryChart({ base, target, spotRate }: HistoryChartProps) {
  const [range, setRange] = useState<number>(30); // Default 30 days (1M)

  const ranges = [
    { label: "1 Week", days: 7 },
    { label: "1 Month", days: 30 },
    { label: "3 Months", days: 90 },
    { label: "6 Months", days: 180 },
    { label: "1 Year", days: 365 },
  ];

  // Generate historical data points matching constraints
  const historyData = useMemo(() => {
    return generateHistory(base, target, spotRate, range);
  }, [base, target, spotRate, range]);

  // Calculate statistics for the range
  const stats = useMemo(() => {
    if (historyData.length === 0) return { min: 0, max: 0, avg: 0, change: 0, changePercent: 0 };
    
    const rates = historyData.map(p => p.rate);
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    const avg = rates.reduce((sum, r) => sum + r, 0) / rates.length;
    
    const startRate = rates[0];
    const endRate = rates[rates.length - 1];
    const change = endRate - startRate;
    const changePercent = (change / startRate) * 100;

    return { min, max, avg, change, changePercent };
  }, [historyData]);

  const baseMeta = CURRENCY_MAP[base];
  const targetMeta = CURRENCY_MAP[target];

  return (
    <div id="historical_analytics_dashboard" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
      
      {/* Upper Meta Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <span className="text-3xl select-none leading-none z-10">{baseMeta?.flag || '🏳️'}</span>
            <span className="text-3xl select-none leading-none -ml-2 border-2 border-slate-900 rounded-full bg-slate-900">{targetMeta?.flag || '🏳️'}</span>
          </div>
          <div>
            <h3 className="font-sans font-bold text-white text-base leading-snug flex items-center gap-1.5">
              {base} / {target} Historical Exchange Area
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Spot value: <span className="font-mono font-bold text-emerald-400">{spotRate.toLocaleString(undefined, { maximumFractionDigits: 5 })}</span> {target} per 1 {base}
            </p>
          </div>
        </div>

        {/* Range Selector Toggles */}
        <div className="flex items-center gap-1 bg-slate-950/40 p-1 rounded-xl">
          {ranges.map((r) => (
            <button
               id={`btn_range_${r.days}`}
              key={r.days}
              onClick={() => setRange(r.days)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-150 ${
                range === r.days
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white focus:outline-none"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Numerical Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Highest point */}
        <div className="p-4 bg-slate-950/30 border border-slate-800/80 rounded-2xl space-y-1">
          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase font-sans">PERIOD HIGH</span>
          <div className="font-mono font-black text-slate-200 text-sm md:text-base leading-none">
            {stats.max.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}
          </div>
          <span className="text-[9px] text-slate-500 font-mono block">Target currency rate</span>
        </div>

        {/* Lowest point */}
        <div className="p-4 bg-slate-950/30 border border-slate-800/80 rounded-2xl space-y-1">
          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase font-sans">PERIOD LOW</span>
          <div className="font-mono font-black text-slate-200 text-sm md:text-base leading-none">
            {stats.min.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}
          </div>
          <span className="text-[9px] text-slate-500 font-mono block">Target currency rate</span>
        </div>

        {/* Average rate */}
        <div className="p-4 bg-slate-950/30 border border-slate-800/80 rounded-2xl space-y-1">
          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase font-sans">PERIOD AVERAGE</span>
          <div className="font-mono font-black text-slate-200 text-sm md:text-base leading-none">
            {stats.avg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}
          </div>
          <span className="text-[9px] text-slate-500 font-mono block">Target currency rate</span>
        </div>

        {/* Net Change */}
        <div className="p-4 bg-slate-950/30 border border-slate-800/80 rounded-2xl space-y-1">
          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase font-sans">NET CHANGE</span>
          <div className="flex items-center gap-1 font-mono font-black text-sm md:text-base leading-none">
            {stats.changePercent >= 0 ? (
              <span className="text-emerald-400 flex items-center gap-0.5">
                <ArrowUpRight className="w-4 h-4" /> +{stats.changePercent.toFixed(2)}%
              </span>
            ) : (
              <span className="text-rose-450 flex items-center gap-0.5">
                <ArrowDownRight className="w-4 h-4" /> {stats.changePercent.toFixed(2)}%
              </span>
            )}
          </div>
          <span className="text-[9px] text-slate-550 font-mono block">
            {stats.change >= 0 ? '+' : ''}{stats.change.toLocaleString(undefined, { maximumFractionDigits: 5 })} {target}
          </span>
        </div>
      </div>

      {/* Area Chart visualization using Recharts */}
      <div id="chart_container_div" className="h-72 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={historyData}
            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.00} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
            <XAxis
              dataKey="date"
              stroke="#475569"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              domain={["auto", "auto"]}
              stroke="#475569"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              orientation="right"
              dx={5}
              tickFormatter={(val) => val.toLocaleString(undefined, { maximumFractionDigits: val < 1 ? 4 : 2 })}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 shadow-xl font-sans">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wilder">{data.date}</p>
                      <p className="font-mono text-xs font-extrabold text-emerald-400 mt-1">
                        1 {base} = {data.rateFormatted} {target}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="rate"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRate)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Insight notice card */}
      <div id="chart_hint" className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-400/90">
        <Info className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
        <p className="font-sans leading-relaxed">
          Historical rate graphs render a 100% mathematically consistent <strong>Brownian Bridge Corridor</strong> linked directly to today's live rate spot pricing. To generate a customized, professional market sentiment analysis of this pair, click on the **AI Analyst** option below!
        </p>
      </div>
    </div>
  );
}
