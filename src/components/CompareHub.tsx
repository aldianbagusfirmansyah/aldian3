import React, { useState, useMemo } from "react";
import { generateHistory } from "../utils/finance";
import { CURRENCY_LIST, CURRENCY_MAP } from "../data/currencies";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Coins, CircleDot, Info, Plus, X, BarChart4 } from "lucide-react";

interface CompareHubProps {
  baseCurrency: string;
  rates: Record<string, number>;
}

export default function CompareHub({ baseCurrency, rates }: CompareHubProps) {
  const [selectedTargets, setSelectedTargets] = useState<string[]>(['EUR', 'GBP', 'JPY']);
  const [range, setRange] = useState<number>(30); // 30 days default
  const [addSelect, setAddSelect] = useState<string>("CAD");

  const ranges = [
    { label: "1 Week", days: 7 },
    { label: "1 Month", days: 30 },
    { label: "3 Months", days: 90 },
    { label: "6 Months", days: 180 },
    { label: "1 Year", days: 365 },
  ];

  const handleAddCompare = () => {
    if (addSelect && !selectedTargets.includes(addSelect) && addSelect !== baseCurrency) {
      setSelectedTargets(prev => [...prev, addSelect]);
    }
  };

  const handleRemoveCompare = (code: string) => {
    setSelectedTargets(prev => prev.filter(c => c !== code));
  };

  // Generate historical percentage curves
  const compareChartData = useMemo(() => {
    if (selectedTargets.length === 0) return [];
    
    // Generate raw points for each target
    const targetSets = selectedTargets.map(code => {
      const spot = rates[code] || 1.0;
      return {
        code,
        points: generateHistory(baseCurrency, code, spot, range)
      };
    });

    if (targetSets.length === 0 || targetSets[0].points.length === 0) return [];

    const numPoints = targetSets[0].points.length;
    const finalData: any[] = [];

    for (let i = 0; i < numPoints; i++) {
      const dateSample = targetSets[0].points[i].date;
      const row: any = { date: dateSample };

      targetSets.forEach(set => {
        const p = set.points[i];
        const firstPoint = set.points[0];
        
        // Calculate cumulative percentage change: ((Rate - StartRate) / StartRate) * 100
        // E.g. to compare trends normalized to 0% at start
        if (firstPoint && firstPoint.rate > 0) {
          const pctChange = ((p.rate - firstPoint.rate) / firstPoint.rate) * 100;
          row[set.code] = parseFloat(pctChange.toFixed(3));
          row[`${set.code}_raw`] = p.rateFormatted;
        } else {
          row[set.code] = 0;
        }
      });

      finalData.push(row);
    }

    return finalData;
  }, [baseCurrency, selectedTargets, range, rates]);

  // Available options to compare
  const compareOptions = useMemo(() => {
    return CURRENCY_LIST.filter(c => c.code !== baseCurrency && !selectedTargets.includes(c.code));
  }, [baseCurrency, selectedTargets]);

  const colors = [
    "#10b981", // Emerald
    "#3b82f6", // Blue
    "#ec4899", // Pink
    "#f59e0b", // Amber
    "#06b6d4"  // Cyan
  ];

  return (
    <div id="compare_hub_root" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
      
      {/* Compare Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h3 className="font-sans font-bold tracking-tight text-white text-lg flex items-center gap-2">
            <BarChart4 className="w-5 h-5 text-emerald-400" /> Currency Compare Hub
          </h3>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Normalized performance comparisons starting at <span className="font-bold text-slate-200">0% change</span>.
          </p>
        </div>

        {/* Range select */}
        <div className="flex items-center gap-1 bg-slate-950/40 p-1 rounded-xl">
          {ranges.map((r) => (
            <button
              id={`compare_range_${r.days}`}
              key={r.days}
              onClick={() => setRange(r.days)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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

      {/* Roster list of selected compared tokens */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {selectedTargets.map((code, index) => {
            const meta = CURRENCY_MAP[code];
            const color = colors[index % colors.length];
            return (
              <div
                id={`compare_tag_${code}`}
                key={code}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/40 rounded-xl border border-slate-800 text-xs font-bold text-slate-200"
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span>{meta?.flag} {code}</span>
                <button
                  id={`remove_compare_${code}`}
                  onClick={() => handleRemoveCompare(code)}
                  className="p-1 hover:bg-rose-500/10 rounded text-slate-500 hover:text-rose-400 focus:outline-none transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Adding Compare selector */}
        {selectedTargets.length < 5 && (
          <div className="flex items-center gap-2 pt-1.5">
            <select
              id="add_compare_select"
              value={addSelect}
              onChange={(e) => setAddSelect(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 outline-none cursor-pointer"
            >
              {compareOptions.map(c => (
                <option key={c.code} value={c.code} className="bg-slate-900 text-slate-200">
                  {c.flag} {c.code} - {c.name}
                </option>
              ))}
            </select>
            <button
               id="add_compare_btn"
              onClick={handleAddCompare}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Add to compare
            </button>
          </div>
        )}
      </div>

      {/* Line Chart comparing indices */}
      <div id="compare_chart_box" className="h-80 w-full">
        {selectedTargets.length === 0 ? (
          <div className="h-full border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 text-xs">
            Add at least one currency above to plot comparative dynamics.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={compareChartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} dy={10} />
              <YAxis
                stroke="#475569"
                fontSize={10}
                axisLine={false}
                tickLine={false}
                orientation="right"
                dx={5}
                tickFormatter={(val) => `${val > 0 ? '+' : ''}${val}%`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 shadow-xl font-sans text-slate-200 text-xs space-y-2.5">
                        <p className="text-[10px] font-bold text-slate-400 border-b border-slate-800 pb-1 uppercase">{data.date}</p>
                        <div className="space-y-1.5">
                          {payload.map((entry, idx) => {
                            const val = entry.value as number;
                            const decColor = entry.color;
                            return (
                              <div key={idx} className="flex items-center justify-between gap-6 font-bold">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: decColor }} />
                                  <span className="text-slate-300">{entry.name}:</span>
                                </div>
                                <span className="font-mono text-emerald-400">
                                  {val >= 0 ? '+' : ''}{val}% ({data[`${entry.name}_raw`]})
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend size={10} iconSize={8} iconType="circle" />
              
              {selectedTargets.map((code, index) => {
                const color = colors[index % colors.length];
                return (
                  <Line
                    key={code}
                    type="monotone"
                    dataKey={code}
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Compare explanation notice */}
      <div id="compare_notice" className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-400/95">
        <Info className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
        <p className="font-sans leading-relaxed font-medium">
          Comparing currencies on an absolute axis isn't helpful due to pricing scale mismatches. This compare tool uses standard <strong>percentage cumulative indexing</strong>, tracking cumulative gains/losses starting precisely at <strong>0%</strong>.
        </p>
      </div>

    </div>
  );
}
