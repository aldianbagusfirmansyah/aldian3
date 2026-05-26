import React, { useState, useMemo } from "react";
import { Currencies, CURRENCY_MAP } from "../data/currencies";
import { ArrowUpDown, Plus, Trash2, ShieldCheck, RefreshCw, Calculator, Percent } from "lucide-react";

interface ConverterProps {
  initialBase: string;
  rates: Record<string, number>;
}

export default function Converter({ initialBase, rates }: ConverterProps) {
  const [sourceAmount, setSourceAmount] = useState<number>(100);
  const [sourceCurrency, setSourceCurrency] = useState<string>(initialBase);
  const [targetList, setTargetList] = useState<string[]>(['EUR', 'GBP', 'JPY', 'CAD', 'AUD']);
  const [addDropdownVal, setAddDropdownVal] = useState<string>("EUR");
  
  // Custom spreads/broker margins
  const [markupPercent, setMarkupPercent] = useState<number>(0); // Default interbank mid-market

  const markups = [
    { name: "Interbank Rate (Mid-market)", value: 0 },
    { name: "Traditional Bank (0.75%)", value: 0.0075 },
    { name: "Standard Retail (1.5%)", value: 0.015 },
    { name: "Retail Tourist / Airport Booth (3.0%)", value: 0.03 }
  ];

  // Dynamically calculate cross rates
  // rateSourceToTarget = (USD_to_Target) / (USD_to_Source)
  const convertedTargets = useMemo(() => {
    const usdToSource = rates[sourceCurrency] || 1;
    
    return targetList.map(code => {
      const meta = CURRENCY_MAP[code];
      const usdToTarget = rates[code] || 1;
      
      // mid-market cross rate
      const rawCrossRate = usdToTarget / usdToSource;
      
      // Apply broker markup
      // For conversions, a markup reduces the received amount if buying the target, or represents real spread
      const effectiveRate = rawCrossRate * (1 - markupPercent);
      const convertedValue = sourceAmount * effectiveRate;

      return {
        code,
        name: meta?.name || "Unknown",
        symbol: meta?.symbol || "",
        flag: meta?.flag || "🏳️",
        rate: effectiveRate,
        value: convertedValue
      };
    });
  }, [sourceAmount, sourceCurrency, targetList, rates, markupPercent]);

  // Handle reversing source and the first target currency
  const handleReverseSourceAndTarget = () => {
    if (targetList.length > 0) {
      const firstTarget = targetList[0];
      const firstTargetRate = rates[firstTarget] || 1;
      const sourceRate = rates[sourceCurrency] || 1;
      const cross = firstTargetRate / sourceRate;

      // Swap currencies and adjust source amount to preserve visual scale
      setSourceCurrency(firstTarget);
      setTargetList([sourceCurrency, ...targetList.slice(1)]);
      setSourceAmount(Number((sourceAmount * cross).toFixed(2)));
    }
  };

  const handleAddTarget = () => {
    if (addDropdownVal && !targetList.includes(addDropdownVal) && addDropdownVal !== sourceCurrency) {
      setTargetList(prev => [...prev, addDropdownVal]);
    }
  };

  const handleRemoveTarget = (code: string) => {
    setTargetList(prev => prev.filter(c => c !== code));
  };

  // Find remaining currencies not in the targets or source list
  const availableOptions = useMemo(() => {
    return Currencies.filter(c => c.code !== sourceCurrency && !targetList.includes(c.code));
  }, [sourceCurrency, targetList]);

  return (
    <div id="converter_tool_container" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="font-sans font-bold tracking-tight text-white text-lg flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-400" /> Multi-Currency Conversion Desk
          </h3>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Convert a source sum into multiple target currencies simultaneously.
          </p>
        </div>
        
        {/* Margin Markup Selector */}
        <div id="markup_wrapper" className="flex items-center gap-2 text-xs bg-slate-950/40 px-3 py-2 rounded-xl border border-slate-800">
          <Percent className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Margin:</span>
          <select
            id="broker_markup_select"
            value={markupPercent}
            onChange={(e) => setMarkupPercent(Number(e.target.value))}
            className="bg-transparent font-bold text-emerald-400 focus:outline-none cursor-pointer"
          >
            {markups.map((m) => (
              <option key={m.value} value={m.value} className="bg-slate-900 text-slate-200">
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inputs Board */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-950/40 p-5 rounded-2xl border border-slate-800/80">
        {/* Source Amount */}
        <div className="md:col-span-6 space-y-1.5">
          <label htmlFor="source_amount_input" className="block text-xs font-bold text-slate-500 font-sans uppercase tracking-widest">
            You Send (Transfer Amount)
          </label>
          <div className="relative">
            <input
              id="source_amount_input"
              type="number"
              value={sourceAmount === 0 ? "" : sourceAmount}
              onChange={(e) => setSourceAmount(Math.max(0, Number(e.target.value)))}
              className="w-full pl-4 pr-16 py-3 text-lg font-mono font-bold text-slate-100 bg-slate-900 border border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-none transition-all duration-200"
              placeholder="0.00"
            />
            <span className="absolute inset-y-0 right-4 flex items-center text-sm font-bold text-slate-400 font-mono pointer-events-none select-none">
              {CURRENCY_MAP[sourceCurrency]?.symbol || ''}
            </span>
          </div>
        </div>

        {/* Source Currency Selector */}
        <div className="md:col-span-4 space-y-1.5">
          <label htmlFor="source_currency_select" className="block text-xs font-bold text-slate-500 font-sans uppercase tracking-widest">
            Source Currency
          </label>
          <select
            id="source_currency_select"
            value={sourceCurrency}
            onChange={(e) => setSourceCurrency(e.target.value)}
            className="w-full px-3 py-3 text-sm bg-slate-900 border border-slate-800 rounded-xl font-bold text-slate-200 focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-none cursor-pointer transition-all duration-200"
          >
            {Currencies.map((c) => (
              <option key={c.code} value={c.code} className="bg-slate-900 text-slate-200">
                {c.flag} {c.code} - {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Reverse Rates trigger */}
        <div className="md:col-span-2 flex justify-center pt-5">
          <button
            id="reverse_rates_btn"
            onClick={handleReverseSourceAndTarget}
            type="button"
            className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 hover:text-emerald-400 text-slate-400 active:scale-95 transition-all shadow-sm focus:outline-none"
            title="Swap source with first target currency"
          >
            <ArrowUpDown className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Target Conversions Grid */}
      <div id="target_conversions_box" className="space-y-3">
        <span className="block text-xs font-bold text-slate-500 font-sans uppercase tracking-widest font-mono">
          Converted Targets List ({targetList.length})
        </span>

        {convertedTargets.length === 0 ? (
          <div className="py-12 border-2 border-dashed border-slate-800 rounded-2xl text-center text-sm text-slate-500">
            No conversion target currencies added. Add potential currencies below!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {convertedTargets.map((item) => (
              <div
                id={`target_card_${item.code}`}
                key={item.code}
                className="p-4 bg-slate-950/40 hover:bg-slate-900 border border-slate-800/85 rounded-2xl flex items-center justify-between transition-colors group"
               >
                <div className="flex items-center gap-3">
                  <span className="text-2xl select-none leading-none">{item.flag}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-100 text-sm">{item.code}</span>
                      <span className="text-[10px] text-slate-400 font-sans truncate max-w-[100px]">{item.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                      Rate: {item.rate.toLocaleString(undefined, { maximumFractionDigits: 5 })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-mono font-black text-emerald-400 text-base block">
                      {item.symbol}{item.value.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {item.code}
                    </span>
                  </div>
                  
                  {/* Delete from Conversions */}
                  <button
                    id={`remove_target_btn_${item.code}`}
                    onClick={() => handleRemoveTarget(item.code)}
                    className="p-1 hover:bg-rose-500/10 hover:text-rose-400 rounded text-slate-650 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all focus:outline-none"
                    title="Remove from target converter list"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Adding a Target Currency UI */}
      <div id="add_target_currency_box" className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            id="add_target_select"
            value={addDropdownVal}
            onChange={(e) => setAddDropdownVal(e.target.value)}
            className="flex-1 sm:w-64 px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-300 font-medium focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 focus:outline-none"
          >
            {availableOptions.map((c) => (
              <option key={c.code} value={c.code} className="bg-slate-900 text-slate-200">
                {c.flag} {c.code} - {c.name}
              </option>
            ))}
          </select>
          <button
            id="add_target_btn"
            onClick={handleAddTarget}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-lg text-xs font-black flex items-center gap-1 transition-all shadow-sm active:scale-95 shrink-0 focus:outline-none"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Add Target
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-sans flex items-center gap-1.5 mt-2 sm:mt-0 font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Real-time conversions protected
        </div>
      </div>
    </div>
  );
}
