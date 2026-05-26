import React, { useState, useMemo } from "react";
import { Currencies, CURRENCY_MAP } from "../data/currencies";
import { CurrencyMetadata } from "../types";
import { Search, Globe, ChevronUp, ChevronDown, TrendingUp, Sparkles, Plus, Calendar, Coins } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface RatesTableProps {
  baseCurrency: string;
  rates: Record<string, number>;
  onSelectBase: (code: string) => void;
  onOpenChart: (code: string) => void;
  onAddToConverter: (code: string) => void;
}

export default function RatesTable({
  baseCurrency,
  rates,
  onSelectBase,
  onOpenChart,
  onAddToConverter
}: RatesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContinent, setSelectedContinent] = useState<string>("All");
  const [sortField, setSortField] = useState<'code' | 'name' | 'rate'>('code');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const continents = ["All", "Americas", "Europe", "Asia", "Africa", "Middle East", "Oceania"];

  // Filter & sort list
  const filteredAndSorted = useMemo(() => {
    return Currencies.map(curr => {
      const rawRate = rates[curr.code];
      return {
        ...curr,
        rate: rawRate !== undefined ? rawRate : null
      };
    })
    .filter(curr => {
      // Matches Search Term
      const normSearch = searchTerm.toLowerCase();
      const codeMatch = curr.code.toLowerCase().includes(normSearch);
      const nameMatch = curr.name.toLowerCase().includes(normSearch);
      const countriesMatch = curr.countries.some(c => c.toLowerCase().includes(normSearch));
      const symbolMatch = curr.symbol.includes(searchTerm);
      
      const searchOk = codeMatch || nameMatch || countriesMatch || symbolMatch;
      
      // Matches Continent Tab
      const continentOk = selectedContinent === "All" || curr.continent === selectedContinent;
      
      return searchOk && continentOk;
    })
    .sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      // Rates can be null if not loaded yet
      if (sortField === 'rate') {
        valA = a.rate ?? -1;
        valB = b.rate ?? -1;
      }

      if (valA === null) return 1;
      if (valB === null) return -1;

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [searchTerm, selectedContinent, sortField, sortDirection, rates]);

  const handleSort = (field: 'code' | 'name' | 'rate') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div id="rates_dashboard" className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col h-full">
      {/* Header Utilities */}
      <div className="p-5 border-b border-slate-800 bg-slate-950/40 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-sans font-bold tracking-tight text-white text-lg flex items-center gap-2">
              <Coins className="w-5 h-5 text-emerald-400" /> Circulating World Currencies
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Live rates relative to <span className="font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg text-[11.5px]">{baseCurrency}</span>
            </p>
          </div>
          
          {/* Quick Search Wrap */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              id="currency_search_input"
              type="text"
              placeholder="Search by code, country, or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-800 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all duration-200"
            />
          </div>
        </div>

        {/* Categories Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {continents.map((continent) => (
            <button
              id={`tab_${continent.toLowerCase().replace(" ", "_")}`}
              key={continent}
              onClick={() => setSelectedContinent(continent)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-150 ${
                selectedContinent === continent
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "bg-slate-850 text-slate-300 border border-slate-750/50 hover:bg-slate-800 hover:text-white active:scale-95"
              }`}
            >
              {continent}
            </button>
          ))}
        </div>
      </div>

      {/* Main List Table */}
      <div className="flex-1 overflow-y-auto min-h-[400px]">
        {filteredAndSorted.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center p-6 bg-slate-900">
            <Globe className="w-12 h-12 text-slate-700 stroke-1 animate-pulse mb-3" />
            <p className="text-slate-400 font-sans text-sm">No currencies matched your filters.</p>
            <button 
              id="clear_search_btn"
              onClick={() => { setSearchTerm(""); setSelectedContinent("All"); }}
              className="mt-3 text-xs text-emerald-400 font-bold hover:underline focus:outline-none"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <table id="currencies_rates_table" className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/40 text-[11px] font-semibold text-slate-400 tracking-wider sticky top-0 bg-slate-900/95 backdrop-blur-sm shadow-[0_1px_0_0_rgba(30,41,59,1)] z-10 transition-shadow">
                <th 
                  id="header_sort_code"
                  onClick={() => handleSort('code')} 
                  className="p-4 cursor-pointer hover:bg-slate-800 active:bg-slate-800/80 transition-colors w-24 select-none"
                >
                  <div className="flex items-center gap-1.5">
                    CODE 
                    {sortField === 'code' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />)}
                  </div>
                </th>
                <th 
                  id="header_sort_name"
                  onClick={() => handleSort('name')} 
                  className="p-4 cursor-pointer hover:bg-slate-800 active:bg-slate-800/80 transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    CURRENCY NAME
                    {sortField === 'name' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />)}
                  </div>
                </th>
                <th 
                  id="header_sort_rate"
                  onClick={() => handleSort('rate')} 
                  className="p-4 cursor-pointer hover:bg-slate-800 active:bg-slate-800/80 transition-colors w-40 text-right select-none"
                >
                  <div className="flex items-center gap-1.5 justify-end">
                    EXCHANGE RATE
                    {sortField === 'rate' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />)}
                  </div>
                </th>
                <th className="p-4 text-center w-36 select-none">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <AnimatePresence initial={false}>
                {filteredAndSorted.map((curr) => {
                  const isCurrentBase = curr.code === baseCurrency;
                  return (
                    <motion.tr
                      id={`row_${curr.code}`}
                      key={curr.code}
                      layout="position"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className={`hover:bg-slate-800/30 transition-colors group ${isCurrentBase ? "bg-emerald-950/20" : ""}`}
                    >
                      {/* Code Block */}
                      <td className="p-4 font-mono font-bold text-sm text-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xl leading-none select-none">{curr.flag}</span>
                          <span className="tracking-wide">{curr.code}</span>
                        </div>
                      </td>

                      {/* Name & Countries */}
                      <td className="p-4">
                        <div className="flex flex-col max-w-sm md:max-w-md lg:max-w-lg">
                          <span className="font-sans text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                            {curr.name}
                            <span className="text-xs text-emerald-400 font-bold">({curr.symbol})</span>
                          </span>
                          <span className="text-[10px] text-slate-500 font-sans truncate mt-0.5">
                            🌍 {curr.countries.join(", ")}
                          </span>
                        </div>
                      </td>

                      {/* Live Rates */}
                      <td className="p-4 text-right">
                        {isCurrentBase ? (
                          <span className="text-xs font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full font-sans select-none border border-emerald-500/20">
                            Base Currency
                          </span>
                        ) : curr.rate !== null ? (
                          <div className="flex flex-col items-end">
                            <span className="font-mono font-bold text-slate-100 text-[14px]">
                              {curr.rate.toLocaleString(undefined, {
                                minimumFractionDigits: curr.rate < 0.1 ? 5 : curr.rate < 10 ? 4 : 2,
                                maximumFractionDigits: curr.rate < 0.1 ? 6 : curr.rate < 10 ? 4 : 2,
                              })}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono mt-0.5">
                              1 {baseCurrency} = {curr.rate.toLocaleString(undefined, { maximumFractionDigits: 5 })} {curr.code}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs italic">Loading...</span>
                        )}
                      </td>

                      {/* Action Triggers */}
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1 text-xs">
                          {/* Set as Base rate */}
                          {!isCurrentBase && (
                            <button
                              id={`action_set_base_${curr.code}`}
                              onClick={() => onSelectBase(curr.code)}
                              title="Set as core comparison base"
                              className="p-1.5 hover:bg-slate-800 hover:text-emerald-400 rounded text-slate-500 transition-colors focus:outline-none"
                            >
                              <Globe className="w-3.5 h-3.5" />
                            </button>
                          )}
                          
                          {/* Historical Charts */}
                          <button
                            id={`action_chart_${curr.code}`}
                            onClick={() => onOpenChart(curr.code)}
                            title="Open historical graphs & analytics"
                            className="p-1.5 hover:bg-slate-805 hover:text-emerald-400 rounded text-slate-500 transition-colors focus:outline-none flex items-center gap-1 px-2 group-hover:bg-slate-800/60"
                          >
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[10px] font-sans font-bold hidden md:inline">Chart</span>
                          </button>

                          {/* Add directly to conversion table list */}
                          <button
                            id={`action_add_converter_${curr.code}`}
                            onClick={() => onAddToConverter(curr.code)}
                            title="Add to conversion tracker list"
                            className="p-1.5 hover:bg-slate-800 hover:text-emerald-400 rounded text-slate-500 transition-colors focus:outline-none"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      {/* Static summary footer */}
      <div className="p-4 bg-slate-950 border-t border-slate-850 text-center text-xs text-slate-400 font-sans flex items-center justify-between">
        <span>Showing {filteredAndSorted.length} of {Currencies.length} currencies</span>
        <span className="text-[10px] text-emerald-400 font-bold">Sort via Code & Rate headers</span>
      </div>
    </div>
  );
}
