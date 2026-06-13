import React from "react";
import { LiveTelemetry, TelemetryHistoryPoint } from "../types";
import { 
  Wifi, 
  Activity, 
  Clock, 
  Gauge, 
  Shuffle, 
  Cpu, 
  ArrowUpRight, 
  ArrowDownRight 
} from "lucide-react";

interface MetricsProps {
  currentTelemetry: LiveTelemetry;
  history: TelemetryHistoryPoint[];
}

export default function NetworkMetrics({ currentTelemetry, history }: MetricsProps) {
  // Helper to extract nested history list and draw a responsive visual mini sparkline
  const drawSparkline = (
    data: TelemetryHistoryPoint[],
    key: keyof LiveTelemetry,
    color: string,
    minVal: number,
    maxVal: number
  ) => {
    if (data.length < 2) return null;

    const points = data.map((d) => d[key] as number);
    const range = maxVal - minVal || 1;

    // Dimensions
    const width = 120;
    const height = 30;

    const coords = points.map((val, idx) => {
      const x = (idx / (points.length - 1)) * width;
      // Flip coordinates system so 0 is top
      const percentage = (val - minVal) / range;
      const y = height - percentage * (height - 4) - 2;
      return { x, y };
    });

    const pathData = coords.reduce(
      (path, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${path} L ${pt.x} ${pt.y}`),
      ""
    );
    // Closed path for fill area
    const areaData = `${pathData} L ${width} ${height} L 0 ${height} Z`;

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <defs>
          <linearGradient id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={areaData} fill={`url(#gradient-${key})`} />
        <path d={pathData} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        {/* Draw a subtle pulse at the last point */}
        {coords.length > 0 && (
          <circle 
            cx={coords[coords.length - 1].x} 
            cy={coords[coords.length - 1].y} 
            r={3} 
            fill={color} 
            stroke="#0f172a" 
            strokeWidth={1}
            className="animate-pulse"
          />
        )}
      </svg>
    );
  };

  // Compute metric comparison against the previous log tick to show growth / optimization arrows
  const getComparisonTrend = (key: keyof LiveTelemetry) => {
    if (history.length < 2) return null;
    const current = history[history.length - 1][key] as number;
    const previous = history[history.length - 2][key] as number;
    const delta = current - previous;

    if (Math.abs(delta) < 0.01) return null;

    const isLatencyOrLoss = key === "latency" || key === "packetLoss";
    // For latency and loss, lower is better. For others, higher is better.
    const isImproved = isLatencyOrLoss ? delta < 0 : delta > 0;

    return {
      delta: Math.abs(delta).toFixed(key === "throughput" || key === "packetLoss" ? 1 : 0),
      isImproved,
      increased: delta > 0
    };
  };

  return (
    <div id="metrics-dashboard-grid" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      
      {/* 1. LATENCY (Target optimized Metric) */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4.5 flex flex-col justify-between transition-all duration-300 hover:border-indigo-500/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-400" />
            Ping Latency
          </span>
          {(() => {
            const trend = getComparisonTrend("latency");
            if (!trend) return null;
            return (
              <span className={`text-[10px] flex items-center gap-0.5 font-semibold ${trend.isImproved ? "text-emerald-400" : "text-rose-400"}`}>
                {trend.isImproved ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                {trend.delta}ms
              </span>
            );
          })()}
        </div>
        <div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={`text-2xl font-bold tracking-tight font-mono ${
              currentTelemetry.latency < 28 ? "text-emerald-400" : 
              currentTelemetry.latency < 75 ? "text-amber-400" : "text-rose-400"
            }`}>
              {currentTelemetry.latency}
            </span>
            <span className="text-xs text-slate-500 font-medium">ms</span>
          </div>
          <div className="mt-3.5 bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/50">
            {drawSparkline(history, "latency", "#818cf8", 0, 160)}
          </div>
        </div>
      </div>

      {/* 2. PACKET LOSS */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4.5 flex flex-col justify-between transition-all duration-300 hover:border-slate-700/65">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-400" />
            Packet Loss
          </span>
          {(() => {
            const trend = getComparisonTrend("packetLoss");
            if (!trend) return null;
            return (
              <span className={`text-[10px] flex items-center gap-0.5 font-semibold ${trend.isImproved ? "text-emerald-400" : "text-rose-400"}`}>
                {trend.isImproved ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                {trend.delta}%
              </span>
            );
          })()}
        </div>
        <div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={`text-2xl font-bold tracking-tight font-mono ${
              currentTelemetry.packetLoss < 0.8 ? "text-emerald-400" : 
              currentTelemetry.packetLoss < 4 ? "text-amber-400" : "text-rose-400"
            }`}>
              {currentTelemetry.packetLoss}%
            </span>
            <span className="text-xs text-slate-500 font-medium">dropped</span>
          </div>
          <div className="mt-3.5 bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/50">
            {drawSparkline(history, "packetLoss", "#34d399", 0, 12)}
          </div>
        </div>
      </div>

      {/* 3. THROUGHPUT */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4.5 flex flex-col justify-between transition-all duration-300 hover:border-slate-700/65">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-cyan-400" />
            Net Throughput
          </span>
          {(() => {
            const trend = getComparisonTrend("throughput");
            if (!trend) return null;
            return (
              <span className={`text-[10px] flex items-center gap-0.5 font-semibold ${trend.isImproved ? "text-emerald-400" : "text-rose-400"}`}>
                {trend.increased ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {trend.delta}M
              </span>
            );
          })()}
        </div>
        <div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold text-slate-100 tracking-tight font-mono">
              {currentTelemetry.throughput}
            </span>
            <span className="text-xs text-slate-500 font-medium">Mbps</span>
          </div>
          <div className="mt-3.5 bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/50">
            {drawSparkline(history, "throughput", "#22d3ee", 0, 950)}
          </div>
        </div>
      </div>

      {/* 4. SIGNAL STRENGTH */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4.5 flex flex-col justify-between transition-all duration-300 hover:border-slate-700/65">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Wifi className="w-4 h-4 text-amber-400" />
            RSSI Signal
          </span>
          {(() => {
            const trend = getComparisonTrend("signalStrength");
            if (!trend) return null;
            return (
              <span className={`text-[10px] flex items-center gap-0.5 font-semibold ${trend.isImproved ? "text-emerald-400" : "text-rose-400"}`}>
                {trend.increased ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {trend.delta}dB
              </span>
            );
          })()}
        </div>
        <div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={`text-2xl font-bold tracking-tight font-mono ${
              currentTelemetry.signalStrength > -55 ? "text-emerald-400" : 
              currentTelemetry.signalStrength > -75 ? "text-amber-400" : "text-rose-400"
            }`}>
              {currentTelemetry.signalStrength}
            </span>
            <span className="text-xs text-slate-500 font-medium">dBm</span>
          </div>
          <div className="mt-3.5 bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/50">
            {drawSparkline(history, "signalStrength", "#fbbf24", -90, -30)}
          </div>
        </div>
      </div>

      {/* 5. BANDWIDTH UTILIZATION */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4.5 flex flex-col justify-between transition-all duration-300 hover:border-slate-700/65">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Shuffle className="w-4 h-4 text-violet-400" />
            Channel Load
          </span>
          {(() => {
            const trend = getComparisonTrend("bandwidthUtilization");
            if (!trend) return null;
            return (
              <span className="text-[10px] flex items-center gap-0.5 font-semibold text-slate-300">
                {trend.increased ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {trend.delta}%
              </span>
            );
          })()}
        </div>
        <div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={`text-2xl font-bold tracking-tight font-mono ${
              currentTelemetry.bandwidthUtilization < 60 ? "text-emerald-400" : 
              currentTelemetry.bandwidthUtilization < 85 ? "text-amber-400" : "text-rose-400"
            }`}>
              {currentTelemetry.bandwidthUtilization}%
            </span>
            <span className="text-xs text-slate-500 font-medium">capacity</span>
          </div>
          <div className="mt-3.5 bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/50">
            {drawSparkline(history, "bandwidthUtilization", "#a78bfa", 0, 100)}
          </div>
        </div>
      </div>

      {/* 6. CONNECTED DEVICES */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4.5 flex flex-col justify-between transition-all duration-300 hover:border-slate-700/65">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-pink-400" />
            Client Nodes
          </span>
          {(() => {
            const trend = getComparisonTrend("connectedDevices");
            if (!trend) return null;
            return (
              <span className="text-[10px] flex items-center gap-0.5 font-semibold text-pink-400">
                {trend.increased ? "+" : ""}{trend.delta} node
              </span>
            );
          })()}
        </div>
        <div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold text-slate-100 tracking-tight font-mono">
              {currentTelemetry.connectedDevices}
            </span>
            <span className="text-xs text-slate-500 font-medium">IoT devices</span>
          </div>
          <div className="mt-3.5 bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/50">
            {drawSparkline(history, "connectedDevices", "#f472b6", 0, 18)}
          </div>
        </div>
      </div>

    </div>
  );
}
