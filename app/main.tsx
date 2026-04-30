/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  ReferenceArea
} from 'recharts';
import { 
  Activity, 
  Settings, 
  RefreshCcw, 
  Info, 
  ShieldCheck, 
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Layers,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { calculateEquilibriumMetrics, generateSyntheticData, MarketPoint, MetricOutput } from './utils/math';
import { cn } from './lib/utils';

// --- Components ---

const MetricCard = ({ title, value, threshold, maxThreshold, minThreshold, description, icon: Icon, unit = "" }: any) => {
  let isHealthy = true;
  if (maxThreshold !== undefined && minThreshold !== undefined) {
    isHealthy = value >= minThreshold && value <= maxThreshold;
  } else if (threshold !== undefined) {
    isHealthy = value < threshold;
  }
  
  const progressValue = maxThreshold !== undefined 
    ? ((value - minThreshold) / (maxThreshold - minThreshold)) * 100
    : (value / (threshold || 1)) * 50;

  return (
    <div className="bg-[#0d1017] border border-white/5 p-5 rounded-lg shadow-inner flex flex-col gap-3 group transition-all hover:border-cyan-500/20">
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-bold text-cyan-500/80 tracking-tighter uppercase font-mono">{title}</span>
        <span className={cn(
          "text-[9px] uppercase font-mono px-2 py-0.5 rounded border leading-none transition-colors",
          isHealthy ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
        )}>
          {isHealthy ? "BALANCED" : "OUT_OF_BAND"}
        </span>
      </div>
      <div>
        <div className="text-3xl font-mono text-white tracking-tight flex items-baseline gap-1">
          {value.toFixed(4)}
          <span className="text-[10px] text-slate-500 font-normal">{unit}</span>
        </div>
        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-3">
          <div 
            className={cn("h-full transition-all duration-700", isHealthy ? "bg-cyan-500" : "bg-rose-500")} 
            style={{ width: `${Math.max(5, Math.min(100, progressValue))}%` }}
          ></div>
        </div>
      </div>
      <p className="text-[10px] text-slate-500 font-mono italic mt-auto">{description}</p>
    </div>
  );
};

export default function App() {
  const [windowSize, setWindowSize] = useState(20);
  const [thresholdS, setThresholdS] = useState(0.2);
  const [thresholdC, setThresholdC] = useState(0.15);
  const [vRange, setVRange] = useState({ min: 0.6, max: 1.5 });
  const [marketData, setMarketData] = useState<MarketPoint[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Initialize data
  useEffect(() => {
    setMarketData(generateSyntheticData(300));
  }, []);

  const resetData = () => {
    setMarketData(generateSyntheticData(300));
  };

  // Process data with sliding window
  const processedData = useMemo(() => {
    if (marketData.length < windowSize) return [];

    return marketData.map((point, index) => {
      if (index < windowSize) {
        return {
          ...point,
          symmetry: 0,
          centralDistortion: 0,
          structuralPersistence: 0,
          isEquilibrium: false
        };
      }

      const window = marketData.slice(index - windowSize, index).map(p => p.price);
      const metrics = calculateEquilibriumMetrics(window, thresholdS, thresholdC, vRange.min, vRange.max);

      return {
        ...point,
        ...metrics
      };
    }).slice(windowSize);
  }, [marketData, windowSize, thresholdS, thresholdC, vRange]);

  const currentMetrics = processedData[processedData.length - 1] || null;

  return (
    <div className="flex h-screen bg-[#050608] text-slate-300 font-sans overflow-hidden selection:bg-cyan-500/30">
      {/* Background Dot Pattern Overlay */}
      <div className="fixed inset-0 bg-grid opacity-10 pointer-events-none z-0" />

      {/* --- Sidebar (Controls) --- */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside 
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 150 }}
            className="w-[280px] bg-[#0d1017] border-r border-white/5 flex flex-col z-20 shadow-2xl relative"
          >
             <div className="p-6 border-b border-white/5">
              <h1 className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-500 mb-1">Integrity Module</h1>
              <h2 className="text-xl font-light text-white tracking-tighter">Equilibrium Filter</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="h-[1px] flex-1 bg-white/5" />
                  <h2 className="text-[9px] font-bold uppercase tracking-[0.2em] font-mono whitespace-nowrap">Temporal</h2>
                  <div className="h-[1px] flex-1 bg-white/5" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase font-mono text-slate-500">Window Samples</label>
                    <span className="text-xs font-mono text-cyan-400">{windowSize}</span>
                  </div>
                  <input 
                    type="range" min="5" max="100" step="1" 
                    value={windowSize} onChange={(e) => setWindowSize(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="h-[1px] flex-1 bg-white/5" />
                  <h2 className="text-[9px] font-bold uppercase tracking-[0.2em] font-mono whitespace-nowrap">Thresholds</h2>
                  <div className="h-[1px] flex-1 bg-white/5" />
                </div>
                
                <div className="space-y-5">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase font-mono text-slate-500">Symmetry (S)</label>
                      <span className="text-xs font-mono text-cyan-400">{thresholdS.toFixed(2)}</span>
                    </div>
                    <input 
                      type="range" min="0.05" max="0.5" step="0.01" 
                      value={thresholdS} onChange={(e) => setThresholdS(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase font-mono text-slate-500">Distortion (C)</label>
                      <span className="text-xs font-mono text-cyan-400">{thresholdC.toFixed(2)}</span>
                    </div>
                    <input 
                      type="range" min="0.02" max="0.4" step="0.01" 
                      value={thresholdC} onChange={(e) => setThresholdC(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="h-[1px] flex-1 bg-white/5" />
                  <h2 className="text-[9px] font-bold uppercase tracking-[0.2em] font-mono whitespace-nowrap">Baseline</h2>
                  <div className="h-[1px] flex-1 bg-white/5" />
                </div>
                
                <div className="space-y-5">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase font-mono text-slate-500">V Min</label>
                      <span className="text-xs font-mono text-cyan-400">{vRange.min.toFixed(2)}</span>
                    </div>
                    <input 
                      type="range" min="0" max="1" step="0.05" 
                      value={vRange.min} onChange={(e) => setVRange(prev => ({ ...prev, min: Number(e.target.value) }))}
                      className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase font-mono text-slate-500">V Max</label>
                      <span className="text-xs font-mono text-cyan-400">{vRange.max.toFixed(2)}</span>
                    </div>
                    <input 
                      type="range" min="1" max="3" step="0.05" 
                      value={vRange.max} onChange={(e) => setVRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                      className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>
                </div>
              </section>
            </div>

            <div className="p-6 border-t border-white/5 space-y-3">
              <button 
                onClick={resetData}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-cyan-400 text-black text-[10px] font-bold uppercase tracking-widest rounded transition-all active:scale-95"
              >
                <RefreshCcw className="w-3 h-3" />
                Resample Stream
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10 p-8 pt-6">
        {/* Toggle Sidebar Button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-8 left-10 z-30 p-1.5 bg-[#0d1017] border border-white/10 rounded hover:bg-slate-800 transition-colors"
        >
          <Settings className="w-4 h-4 text-slate-400" />
        </button>

        {/* --- Header Statistics --- */}
        <header className="flex justify-between items-center mb-8 border-b border-white/10 pb-6 ml-14">
          <div>
            <h1 className="text-xs font-mono uppercase tracking-[0.4em] text-cyan-500 mb-1">Market Integrity Module</h1>
            <h2 className="text-3xl font-light text-white tracking-tight">
              Equilibrium Filter Logic 
              <span className="text-slate-500 font-mono text-sm ml-4">v2.4.0-STABLE</span>
            </h2>
          </div>
          
          <div className="flex items-center gap-8 text-right">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Active Samples</div>
              <div className="text-sm font-mono text-white tracking-tight">{processedData.length}</div>
            </div>
            <div className="h-10 w-[1px] bg-white/10"></div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Session Status</div>
              <div className="text-sm font-mono text-green-400">LIVE_STREAM</div>
            </div>
          </div>
        </header>

        {/* --- Dashboard Content --- */}
        <div className="flex-1 grid grid-cols-12 gap-8 overflow-hidden min-h-0">
          {/* Main Visuals Column */}
          <section className="col-span-8 flex flex-col gap-8 min-h-0">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-3 gap-6">
              <MetricCard 
                title="[S] Symmetry" 
                value={currentMetrics?.symmetry || 0} 
                threshold={thresholdS}
                description={`Threshold: < ${thresholdS.toFixed(2)}`}
                icon={TrendingUp}
              />
              <MetricCard 
                title="[C] Centrality" 
                value={currentMetrics?.centralDistortion || 0} 
                threshold={thresholdC}
                description={`Threshold: < ${thresholdC.toFixed(2)}`}
                icon={Zap}
              />
              <MetricCard 
                title="[V] Persistence" 
                value={currentMetrics?.structuralPersistence || 0} 
                minThreshold={vRange.min}
                maxThreshold={vRange.max}
                description={`Band: ${vRange.min.toFixed(2)} - ${vRange.max.toFixed(2)}`}
                icon={Layers}
              />
            </div>

            {/* Price Chart Container */}
            <div className="flex-1 bg-[#0d1017] border border-white/10 rounded-xl p-6 flex flex-col min-h-0 shadow-lg relative overflow-hidden">
               <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-slate-400">Internal Data Distribution</h3>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.6)]"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                </div>
              </div>

              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={processedData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                    <XAxis dataKey="time" hide />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} 
                      axisLine={false}
                      tickLine={false}
                      orientation="right"
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#050608', border: '1px solid #1f2937', color: '#fff', fontSize: '10px', borderRadius: '4px' }}
                      itemStyle={{ color: '#22d3ee' }}
                      labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                    />
                    
                    {processedData.map((d, i) => {
                      if (d.isEquilibrium && (i === 0 || !processedData[i-1]?.isEquilibrium)) {
                        let endIdx = i;
                        while (endIdx < processedData.length && processedData[endIdx].isEquilibrium) {
                          endIdx++;
                        }
                        const RefArea = ReferenceArea as any;
                        return (
                          <RefArea 
                            key={`ref-${i}`} 
                            x1={d.time} 
                            x2={processedData[Math.min(endIdx - 1, processedData.length - 1)].time} 
                            fill="#f43f5e" 
                            fillOpacity={0.08} 
                            stroke="none"
                          />
                        );
                      }
                      return null;
                    })}

                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#22d3ee" 
                      strokeWidth={1.5}
                      fillOpacity={1} 
                      fill="url(#priceGradient)" 
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 pt-6 border-t border-white/5 mt-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">WINDOW_TYPE: GAUSSIAN_FILTERED</div>
                <div className="text-[10px] font-mono text-slate-500 text-right uppercase tracking-widest">$IQR_STABILITY: 0.992</div>
              </div>
            </div>
          </section>

          {/* Right Status Column */}
          <section className="col-span-4 flex flex-col gap-8 min-h-0">
            {/* Classification Panel */}
            <div className={cn(
              "rounded-xl border p-8 flex flex-col items-center justify-center text-center h-[340px] transition-all duration-700 shadow-2xl relative overflow-hidden group",
              currentMetrics?.isEquilibrium 
                ? "bg-rose-500/5 border-rose-500/30 ring-1 ring-rose-500/20" 
                : "bg-cyan-500/5 border-cyan-500/30 ring-1 ring-cyan-500/20"
            )}>
              {/* Pulse Glow Effect */}
              <div className={cn(
                "absolute inset-0 opacity-20 pointer-events-none transition-colors duration-700",
                currentMetrics?.isEquilibrium ? "bg-rose-500/10" : "bg-cyan-500/10"
              )} />

              <div className={cn(
                "w-16 h-16 rounded-full border-2 flex items-center justify-center mb-8 relative transition-all duration-700",
                currentMetrics?.isEquilibrium ? "border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]" : "border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.4)]"
              )}>
                <div className={cn(
                  "w-10 h-10 rounded-sm transition-all duration-700 active:scale-95",
                  currentMetrics?.isEquilibrium ? "bg-rose-500 animate-pulse" : "bg-cyan-500"
                )} />
              </div>

              <div className={cn(
                "text-xs font-mono tracking-[0.3em] uppercase mb-2",
                currentMetrics?.isEquilibrium ? "text-rose-500" : "text-cyan-500"
              )}>
                Filter Classification
              </div>
              
              <div className="text-5xl font-bold text-white tracking-tighter mb-6 group-hover:scale-105 transition-transform">
                {currentMetrics?.isEquilibrium ? "EQUILIBRIUM" : "STRUCTURED"}
              </div>

              <div className={cn(
                "py-3 px-8 text-black text-xs font-bold uppercase tracking-[0.2em] rounded shadow-lg transition-all duration-700",
                currentMetrics?.isEquilibrium ? "bg-rose-500" : "bg-cyan-500"
              )}>
                {currentMetrics?.isEquilibrium ? "DO_NOT_TRADE" : "EVALUATE_ENTRY"}
              </div>

              <p className="mt-8 text-[11px] text-slate-400 leading-relaxed font-mono tracking-tight max-w-[220px]">
                {currentMetrics?.isEquilibrium 
                  ? "Price behavior mimics a balanced random walk. Absence of exploitable structure detected."
                  : "Directional asymmetry detected. Market distribution showing stable structural trends."}
              </p>
            </div>

            {/* Matrix Log */}
            <div className="bg-slate-900/30 border border-white/5 rounded-xl p-6 flex flex-col shadow-lg">
              <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-2">
                <BarChart3 className="w-3 h-3" />
                Decision Matrix Log
              </h4>
              <div className="space-y-4">
                {[
                  { label: "Directional Symmetry", val: (currentMetrics?.symmetry || 1) < thresholdS },
                  { label: "Center Stability", val: (currentMetrics?.centralDistortion || 1) < thresholdC },
                  { label: "Structural Persistence", val: (currentMetrics?.structuralPersistence || 0) >= vRange.min && (currentMetrics?.structuralPersistence || 0) <= vRange.max },
                ].map((row, idx) => (
                  <div key={idx} className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-slate-400">{row.label}</span>
                    <span className={cn(
                      "font-bold underline underline-offset-4 decoration-2",
                      row.val ? "text-cyan-400 decoration-cyan-500/30" : "text-rose-400 decoration-rose-500/30"
                    )}>
                      {row.val ? "PASS" : "FAIL"}
                    </span>
                  </div>
                ))}
                
                <div className="flex items-center justify-between font-mono text-[11px] pt-4 border-t border-white/5">
                  <span className="text-white font-bold">Status Target</span>
                  <span className={cn(
                    "underline underline-offset-4 font-bold tracking-widest",
                    currentMetrics?.isEquilibrium ? "text-rose-400 decoration-rose-500/30" : "text-cyan-400 decoration-cyan-500/30"
                  )}>
                    {currentMetrics?.isEquilibrium ? "LOCKOUT" : "NOMINAL"}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* --- Immersive Footer --- */}
        <footer className="mt-8 flex justify-between items-end relative z-10 border-t border-white/5 pt-6">
          <div className="font-mono text-[9px] text-slate-600 uppercase tracking-[0.2em] space-y-1">
            <div className="flex gap-6">
              <span className="flex items-center gap-1.5 font-bold text-cyan-900">
                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
                ENV: PRODUCTION_SHARD_04
              </span>
              <span>NODE: AP-SOUTHEAST-1</span>
              <span>EPOCH: {Math.floor(Date.now() / 1000)}</span>
            </div>
            <div className="text-slate-700">KERNEL_HASH: 0x82...f9e // STATUS: RECV_DATA_STREAM</div>
          </div>
          <div className="flex gap-2">
            <div className="w-12 h-[2px] bg-cyan-500" />
            <div className="w-6 h-[2px] bg-slate-800" />
            <div className="w-3 h-[2px] bg-slate-800" />
          </div>
        </footer>
      </main>
    </div>
  );
}
