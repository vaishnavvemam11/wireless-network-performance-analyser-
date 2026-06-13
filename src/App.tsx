import React, { useState, useEffect, useRef } from "react";
import { 
  NetworkConfig, 
  LiveTelemetry, 
  TelemetryHistoryPoint, 
  AIAnalysisReport, 
  NetworkEventLog,
  NetworkNode
} from "./types";
import NetworkMetrics from "./components/NetworkMetrics";
import NetworkTopology from "./components/NetworkTopology";
import { 
  Wifi, 
  Activity, 
  Clock, 
  Gauge, 
  Server, 
  Settings2, 
  Zap, 
  Play, 
  Trash2, 
  Radio, 
  AlertTriangle, 
  RotateCcw, 
  Sliders, 
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  CheckCircle,
  HelpCircle,
  Terminal,
  Layers,
  FileText
} from "lucide-react";

export default function App() {
  // ---- 1. CONFIGURATION STATE ----
  const [currentConfig, setCurrentConfig] = useState<NetworkConfig>({
    frequencyBand: "2.4 GHz",
    channel: 6,
    channelWidthMz: 20,
    txPowerDbm: 20,
    csmaBackoffWindow: "Standard",
    antennaMimo: "2x2",
    qosPriority: "FIFO"
  });

  // ---- 2. ACTIVE ANOMALIES STATE ----
  const [activeAnomalies, setActiveAnomalies] = useState<string[]>(["interference"]); // Start with 2.4GHz interference active by default to show a problem

  // ---- 3. SIMULATED TELEMETRY STATE ----
  const [currentTelemetry, setCurrentTelemetry] = useState<LiveTelemetry>({
    latency: 98,
    packetLoss: 5.2,
    throughput: 45,
    signalStrength: -72,
    bandwidthUtilization: 78,
    connectedDevices: 10
  });

  const [history, setHistory] = useState<TelemetryHistoryPoint[]>([]);

  // ---- 4. RECENT EVENT LOGS STATE ----
  const [logs, setLogs] = useState<NetworkEventLog[]>([
    { id: "log-1", timestamp: "01:15:32", type: "info", message: "Gateway Core-AP (AX6000) bootstrapped on channel 6.", source: "SYS" },
    { id: "log-2", timestamp: "01:15:35", type: "warning", message: "RF noise ceiling detected on 2.4 GHz spectrum band.", source: "PHY_RF" },
    { id: "log-3", timestamp: "01:15:36", type: "info", message: "10 client terminal IoT nodes registered with standard power masks.", source: "REGISTRY" }
  ]);

  // ---- 5. AI OPTIMIZATION PANEL STATE ----
  const [aiReport, setAiReport] = useState<AIAnalysisReport | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAiApplied, setIsAiApplied] = useState(false);

  // Keep ref of last values to avoid effects looping on timer tick
  const stateRef = useRef({ currentConfig, activeAnomalies });
  useEffect(() => {
    stateRef.current = { currentConfig, activeAnomalies };
  }, [currentConfig, activeAnomalies]);

  // Helper to add a log
  const pushLog = (message: string, type: "info" | "warning" | "success" | "ai" = "info", source: string = "MONITOR") => {
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];
    setLogs((prev) => [
      { id: `log-${Date.now()}-${Math.random()}`, timestamp: timeStr, type, message, source },
      ...prev.slice(0, 49) // Limiting console backlog to 50 items
    ]);
  };

  // ---- 6. REAL-TIME CLOSED-LOOP FEEDBACK SIMULATOR ----
  useEffect(() => {
    // Generate initial history points
    const points: TelemetryHistoryPoint[] = [];
    const now = new Date();
    for (let i = 15; i >= 0; i--) {
      const pastTime = new Date(now.getTime() - i * 1500);
      const pastTimeStr = pastTime.toTimeString().split(" ")[0];
      points.push({
        latency: 85 + Math.round(Math.random() * 20),
        packetLoss: 4.8 + Number((Math.random() * 1).toFixed(1)),
        throughput: 40 + Math.round(Math.random() * 10),
        signalStrength: -70 + Math.round(Math.random() * 4),
        bandwidthUtilization: 75 + Math.round(Math.random() * 5),
        connectedDevices: 10,
        timestamp: pastTimeStr
      });
    }
    setHistory(points);

    // Physics Engine loop: Tick every 1500ms
    const interval = setInterval(() => {
      const { currentConfig: cfg, activeAnomalies: anomalies } = stateRef.current;

      // Base Parameters in perfect condition
      let baseLat = 14;
      let baseLoss = 0.05;
      let baseThr = 650; 
      let baseSig = -42;
      let baseUtil = 30;

      // Config tuning adjustments
      // 1. Bands impact
      if (cfg.frequencyBand === "5 GHz") {
        baseLat = 9;
        baseThr = 1200;
        baseSig = -46; // slightly attenuates over range
        baseUtil = 22;
      } else if (cfg.frequencyBand === "6 GHz") {
        baseLat = 4;
        baseThr = 2400;
        baseSig = -52; // higher frequency fading
        baseUtil = 14;
      }

      // 2. Channel width impact (wider = more capacity but captures more thermal noise flooring)
      if (cfg.channelWidthMz === 40) {
        baseThr *= 1.8;
        baseLat += 1;
        baseLoss += 0.05;
      } else if (cfg.channelWidthMz === 80) {
        baseThr *= 3.2;
        baseLat += 3;
        baseLoss += 0.15;
      } else if (cfg.channelWidthMz === 160) {
        baseThr *= 5.5;
        baseLat += 6;
        baseLoss += 0.3;
      }

      // 3. Tx power impact
      const powerDelta = cfg.txPowerDbm - 20; // nominal is 20dBm
      baseSig += powerDelta * 1.1;

      // 4. Client Backoff csma window (CSMA collision management)
      const clients = 10 + (anomalies.includes("storm") ? 6 : 0);
      if (cfg.csmaBackoffWindow === "Low") {
        if (clients > 12) {
          baseLat += 65; // Collision avalanche
          baseLoss += 4.5;
          baseThr *= 0.4;
        } else {
          baseLat -= 2; // minor fast-path gain
        }
      } else if (cfg.csmaBackoffWindow === "High") {
        baseLat += 12; // safety delays
        if (clients > 12) {
          baseLoss -= 1.5; // mitigated drops
        }
      }

      // 5. QoS Priorities
      if (cfg.qosPriority === "IoT-Thread-Priority") {
        baseLat = Math.max(2, baseLat - 4);
        baseLoss = Math.max(0.01, baseLoss - 0.05);
      } else if (cfg.qosPriority === "Voice-Priority") {
        baseLat = Math.max(3, baseLat - 2);
      } else if (cfg.qosPriority === "Fair-Queueing") {
        baseLat += 2;
        baseLoss *= 0.8;
      }

      // 6. Active RF Anomalies
      const interferenceActive = anomalies.includes("interference");
      const fadingActive = anomalies.includes("fading");
      const stormActive = anomalies.includes("storm");
      const rogueActive = anomalies.includes("rogue");

      if (interferenceActive) {
        // Severe impact on 2.4GHz, less on 5G, negligible on 6G
        if (cfg.frequencyBand === "2.4 GHz") {
          baseLat += 85;
          baseLoss += 4.8;
          baseThr *= 0.15;
          baseSig -= 18;
          baseUtil += 42;
        } else if (cfg.frequencyBand === "5 GHz") {
          baseLat += 12;
          baseLoss += 0.4;
          baseThr *= 0.85;
          baseSig -= 3;
          baseUtil += 8;
        } else {
          // 6G isolated
          baseLat += 1;
          baseUtil += 2;
        }
      }

      if (fadingActive) {
        // Metal barrier scattering signal
        baseSig -= 18;
        baseLoss += 1.8;
        baseLat += 15;
        baseThr *= 0.65;
      }

      if (stormActive) {
        // High density sensor collisions
        baseUtil += 55;
        baseLat += 65;
        baseLoss += 3.2;
        baseThr *= 0.5;
      }

      if (rogueActive) {
        // Rogue AP
        baseLat += 8;
        baseLoss += 0.5;
        baseThr *= 0.9;
        baseUtil += 12;
      }

      // Ensure boundary rules
      const finalLatency = Math.max(3, Math.round(baseLat + (Math.random() * 4 - 2)));
      const finalLoss = parseFloat(Math.max(0.01, baseLoss + (Math.random() * 0.4 - 0.2)).toFixed(2));
      const finalThr = Math.round(Math.max(12, baseThr + (Math.random() * baseThr * 0.06 - baseThr * 0.03)));
      const finalSig = Math.round(Math.min(-30, Math.max(-95, baseSig + (Math.random() * 2 - 1))));
      const finalUtil = Math.round(Math.min(100, Math.max(5, baseUtil + (Math.random() * 4 - 2))));

      const liveMetrics: LiveTelemetry = {
        latency: finalLatency,
        packetLoss: finalLoss,
        throughput: finalThr,
        signalStrength: finalSig,
        bandwidthUtilization: finalUtil,
        connectedDevices: clients
      };

      setCurrentTelemetry(liveMetrics);

      // Append step history
      const timeStr = new Date().toTimeString().split(" ")[0];
      setHistory((prev) => {
        const nextHist = [...prev, { ...liveMetrics, timestamp: timeStr }];
        if (nextHist.length > 25) {
          nextHist.shift();
        }
        return nextHist;
      });

    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Log notifications on config change
  const handleConfigChange = (updated: Partial<NetworkConfig>) => {
    setCurrentConfig((prev) => {
      const next = { ...prev, ...updated };
      const changedKeys = Object.keys(updated);
      changedKeys.forEach((k) => {
        const keyVal = updated[k as keyof NetworkConfig];
        pushLog(`PHY Layer: Dynamic re-tune applied. ${k} switched to '${keyVal}'.`, "info", "MAC_TUNER");
      });
      // Reset AI Applied badge if they stray from it
      setIsAiApplied(false);
      return next;
    });
  };

  // Toggle Single rf obstruction anomaly
  const toggleAnomaly = (id: string, name: string) => {
    setActiveAnomalies((prev) => {
      const exists = prev.includes(id);
      const updated = exists ? prev.filter((x) => x !== id) : [...prev, id];
      if (exists) {
        pushLog(`RF Controller: Interference threat cleared. '${name}' has been disabled.`, "success", "RF_PHY");
      } else {
        pushLog(`RF Controller: ACTIVE THREAT. Injected artificial '${name}' obstacle into physical floor.`, "warning", "RF_PHY");
      }
      return updated;
    });
  };

  // ---- 7. TRIGGER AI INTERACTION / ANALYTICS ----
  const handleForceLatencyReTune = async () => {
    setAiLoading(true);
    setAiError(null);
    pushLog("AI Engine: Querying neural network latency optimizer core...", "ai", "AI_AGENT");

    try {
      const response = await fetch("/api/network/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          metrics: currentTelemetry,
          config: currentConfig
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const report: AIAnalysisReport = await response.json();
      setAiReport(report);
      pushLog(`AI Engine: Analysis completed with severity ${report.severity}. Host diagnosis: "${report.diagnosis}"`, "success", "AI_AGENT");
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Could not link to optimization routing APIs.");
      pushLog("AI Engine: Optimization call failed. Check configuration keys.", "warning", "AI_AGENT");
    } finally {
      setAiLoading(false);
    }
  };

  // ---- 8. APPLY AUTO-RECONCEIVED RECOMMENDATION ----
  const applyAiRecommendation = () => {
    if (!aiReport) return;
    const rec = aiReport.recommendedConfig;
    setCurrentConfig((prev) => ({
      ...prev,
      frequencyBand: rec.frequencyBand,
      channel: rec.channel,
      channelWidthMz: rec.channelWidthMz,
      txPowerDbm: rec.txPowerDbm,
      csmaBackoffWindow: rec.csmaBackoffWindow,
      qosPriority: rec.qosPriority
    }));
    setIsAiApplied(true);
    pushLog("AI Engine: Self-correction algorithm deployed. Applying channel shifting, band isolation, and QoS tier priority shifts.", "success", "MAC_TUNER");
  };

  // Quick reset parameters to worst case
  const resetToDegradedMode = () => {
    setCurrentConfig({
      frequencyBand: "2.4 GHz",
      channel: 6,
      channelWidthMz: 20,
      txPowerDbm: 12,
      csmaBackoffWindow: "Low",
      antennaMimo: "1x1",
      qosPriority: "FIFO"
    });
    setActiveAnomalies(["interference", "storm"]);
    setIsAiApplied(false);
    setAiReport(null);
    pushLog("System Reset: Forcing highly congested RF default profile.", "warning", "SYS");
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col overflow-hidden select-none">
      
      {/* Top Header Navigation - Geometric Balance Style */}
      <header className="h-16 border-b border-slate-800/80 flex items-center justify-between px-6 bg-slate-900/60 backdrop-blur-md relative z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sky-500 rounded-sm flex items-center justify-center font-bold text-slate-950 text-sm tracking-tight shadow-md shadow-sky-500/10">
            RF
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-widest text-slate-100 uppercase">
              SignalPath <span className="text-[10px] text-sky-400 font-normal ml-1">v4.5</span>
            </h1>
            <span className="text-[9px] text-slate-500 font-mono tracking-tight -mt-0.5">
              Wireless Network Performance Analyser
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={resetToDegradedMode}
            title="Inject Stress Test"
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-slate-400 bg-slate-950 hover:text-rose-400 hover:bg-rose-950/20 rounded border border-slate-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            STRESS TRIGGER
          </button>
          
          <div className="w-px h-8 bg-slate-800"></div>

          <div className="flex flex-col items-end">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">System Quality</span>
            {currentTelemetry.latency < 28 ? (
              <span className="text-emerald-400 text-xs font-mono font-bold flex items-center gap-1 animate-pulse">
                ● OPTIMIZED
              </span>
            ) : currentTelemetry.latency < 75 ? (
              <span className="text-amber-400 text-xs font-mono font-bold flex items-center gap-1">
                ● STABILIZING
              </span>
            ) : (
              <span className="text-rose-400 text-xs font-mono font-bold flex items-center gap-1 animate-pulse">
                ● CRITICAL CONGESTION
              </span>
            )}
          </div>

          <div className="w-px h-8 bg-slate-800 hidden md:block"></div>

          <div className="hidden md:flex items-center gap-4 text-xs font-mono text-slate-400">
            <span>UTC Clock: {new Date().toISOString().split("T")[1].slice(0, 8)}</span>
            <span className="text-[10px] text-slate-500">SESSION ID: <span className="text-sky-400">SHA-256</span></span>
          </div>
        </div>
      </header>

      {/* Main Multi-grid Interface Layout */}
      <main className="flex-1 grid grid-cols-12 gap-px bg-slate-800 overflow-hidden relative">
        
        {/* ================= LEFT SIDEBAR: THREATS AND MAC LAYER TUNING ================= */}
        <section className="col-span-12 lg:col-span-3 bg-slate-950 p-5 flex flex-col gap-6 overflow-y-auto border-r border-slate-800/80 max-h-[calc(100vh-4rem)]">
          
          {/* Anomaly Obstruction simulation switches */}
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-3.5 font-bold flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              RF Obstacle Simulation
            </h2>
            
            <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
              Inject real-world degradation states to view immediate physical feedback loop anomalies.
            </p>

            <div className="space-y-2">
              {/* Microwave Interference */}
              <button
                onClick={() => toggleAnomaly("interference", "2.4GHz RF Jamming")}
                className={`w-full p-3 rounded text-left border transition-all flex items-start gap-2.5 group cursor-pointer ${
                  activeAnomalies.includes("interference")
                    ? "bg-amber-950/20 border-amber-500/40 text-amber-200"
                    : "bg-slate-900/40 border-slate-800/60 text-slate-400 hover:border-slate-700/80"
                }`}
              >
                <div className={`mt-0.5 p-1 rounded ${
                  activeAnomalies.includes("interference") ? "bg-amber-500/20 text-amber-400" : "bg-slate-950 text-slate-600"
                }`}>
                  <Radio className="w-4 h-4 animate-bounce" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold font-mono">2.4GHz RF Jammer</span>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      activeAnomalies.includes("interference") ? "bg-amber-500/20 text-amber-400" : "bg-slate-950 text-slate-500"
                    }`}>
                      {activeAnomalies.includes("interference") ? "ACTIVE" : "STANDBY"}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Simulates high noise floor interference (e.g. Microwave / cordless phones).</p>
                </div>
              </button>

              {/* Multipath Fading / Wall Fading */}
              <button
                onClick={() => toggleAnomaly("fading", "Steel Structural Fading")}
                className={`w-full p-3 rounded text-left border transition-all flex items-start gap-2.5 group cursor-pointer ${
                  activeAnomalies.includes("fading")
                    ? "bg-slate-900 border-indigo-500/50 text-indigo-300"
                    : "bg-slate-900/40 border-slate-800/60 text-slate-400 hover:border-slate-700/80"
                }`}
              >
                <div className={`mt-0.5 p-1 rounded ${
                  activeAnomalies.includes("fading") ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-950 text-slate-600"
                }`}>
                  <Layers className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold font-mono">Structural Wall Fading</span>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      activeAnomalies.includes("fading") ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-950 text-slate-500"
                    }`}>
                      {activeAnomalies.includes("fading") ? "ACTIVE" : "STANDBY"}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Degrades signal strength (-18dBm RSSI) with high multi-path scattering.</p>
                </div>
              </button>

              {/* IoT Telemetry Collision Storm */}
              <button
                onClick={() => toggleAnomaly("storm", "IoT Node Telemetry Storm")}
                className={`w-full p-3 rounded text-left border transition-all flex items-start gap-2.5 group cursor-pointer ${
                  activeAnomalies.includes("storm")
                    ? "bg-rose-950/20 border-rose-500/40 text-rose-200"
                    : "bg-slate-900/40 border-slate-800/60 text-slate-400 hover:border-slate-700/80"
                }`}
              >
                <div className={`mt-0.5 p-1 rounded ${
                  activeAnomalies.includes("storm") ? "bg-rose-500/20 text-rose-400" : "bg-slate-950 text-slate-600"
                }`}>
                  <AlertTriangle className="w-4 h-4 animate-pulse" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold font-mono">IoT Broadcast Storm</span>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      activeAnomalies.includes("storm") ? "bg-rose-500/30 text-rose-400" : "bg-slate-950 text-slate-500"
                    }`}>
                      {activeAnomalies.includes("storm") ? "STORMING" : "STANDBY"}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Causes high-density packet collisions inside the base scheduler queue.</p>
                </div>
              </button>
            </div>
          </div>

          <div className="w-full h-px bg-slate-800/60" />

          {/* Manual Router/AP parameters controllers */}
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-3.5 font-bold flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
              Dynamic Router Tunings
            </h2>

            <div className="space-y-4 text-xs">
              
              {/* Band configuration */}
              <div>
                <label className="text-slate-400 block mb-1.5 font-mono text-[10px]">FREQUENCY BAND</label>
                <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded border border-slate-800">
                  {["2.4 GHz", "5 GHz", "6 GHz"].map((band) => (
                    <button
                      key={band}
                      onClick={() => handleConfigChange({ frequencyBand: band })}
                      className={`py-1 text-[10px] font-bold font-mono rounded-sm transition-all cursor-pointer ${
                        currentConfig.frequencyBand === band
                          ? "bg-sky-500 text-slate-950"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {band}
                    </button>
                  ))}
                </div>
              </div>

              {/* Channel width select */}
              <div>
                <label className="text-slate-400 block mb-1.5 font-mono text-[10px]">CHANNEL WIDTH</label>
                <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded border border-slate-800">
                  {[20, 40, 80, 160].map((width) => (
                    <button
                      key={width}
                      onClick={() => handleConfigChange({ channelWidthMz: width })}
                      className={`py-1 text-[10px] font-bold font-mono rounded-sm transition-all cursor-pointer ${
                        currentConfig.channelWidthMz === width
                          ? "bg-sky-500 text-slate-950"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {width}M
                    </button>
                  ))}
                </div>
              </div>

              {/* Antenna MIMO configuration */}
              <div>
                <label className="text-slate-400 block mb-1.5 font-mono text-[10px]">ANTENNA MIMO GRID</label>
                <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded border border-slate-800">
                  {["1x1", "2x2", "4x4", "8x8"].map((mimo) => (
                    <button
                      key={mimo}
                      onClick={() => handleConfigChange({ antennaMimo: mimo })}
                      className={`py-1 text-[10px] font-bold font-mono rounded-sm transition-all cursor-pointer ${
                        currentConfig.antennaMimo === mimo
                          ? "bg-sky-500 text-slate-950"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {mimo}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transmit Power Slider */}
              <div>
                <div className="flex justify-between items-center mb-1.5 text-[10px] font-mono">
                  <span className="text-slate-400 uppercase">TX POWER</span>
                  <span className="text-sky-400 font-bold">{currentConfig.txPowerDbm} dBm</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="30"
                  value={currentConfig.txPowerDbm}
                  onChange={(e) => handleConfigChange({ txPowerDbm: parseInt(e.target.value) })}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
              </div>

              {/* Queueing priority policy */}
              <div>
                <label className="text-slate-400 block mb-1 text-[10px] font-mono">QOS SCHEDULE PRIORITY</label>
                <select
                  value={currentConfig.qosPriority}
                  onChange={(e) => handleConfigChange({ qosPriority: e.target.value })}
                  className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded px-2.5 py-2 focus:ring-1 focus:ring-sky-500 outline-none text-xs font-mono"
                >
                  <option value="FIFO">FIFO (Default Legacy Queue)</option>
                  <option value="Fair-Queueing">SFQ (Stochastic Fair-Queueing)</option>
                  <option value="Voice-Priority">SIP / VoIP Priority</option>
                  <option value="IoT-Thread-Priority">IoT-Sensor Thread Low-Delay Priority</option>
                </select>
              </div>

              {/* MAC Backoff Window */}
              <div>
                <label className="text-slate-400 block mb-1 text-[10px] font-mono">CSMA COLLISION BACKOFF WINDOW</label>
                <select
                  value={currentConfig.csmaBackoffWindow}
                  onChange={(e) => handleConfigChange({ csmaBackoffWindow: e.target.value })}
                  className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded px-2.5 py-2 focus:ring-1 focus:ring-sky-500 outline-none text-xs font-mono"
                >
                  <option value="Low">Low Window (Optimized for minimal static latency)</option>
                  <option value="Standard">Standard Window (Balanced IEEE 802.11)</option>
                  <option value="High">High Window (Prevents high client collision dropouts)</option>
                </select>
              </div>

            </div>
          </div>
        </section>

        {/* ================= CENTER: MAIN ANALYTICS AND LIVE TOPOLOGY ================= */}
        <section className="col-span-12 lg:col-span-6 bg-slate-950 flex flex-col overflow-y-auto border-r border-slate-800/80 max-h-[calc(100vh-4rem)] p-6 gap-6">
          
          {/* Real-time high contrast visual metric row (extracted from Design highlights) */}
          <NetworkMetrics currentTelemetry={currentTelemetry} history={history} />

          {/* Live topological map - dynamic interactive SVG canvas */}
          <div className="flex-1 min-h-[400px]">
            <NetworkTopology 
              currentConfig={currentConfig} 
              activeAnomalies={activeAnomalies} 
              latency={currentTelemetry.latency} 
            />
          </div>

          {/* Integrated Dynamic Event Terminal Console */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-4.5 font-mono text-[11px] flex flex-col h-48">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                Live Syslog Console
              </span>
              <span>Buffer OK</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 pr-1 select-text">
              {logs.map((l) => (
                <div key={l.id} className="leading-relaxed hover:bg-slate-900/30 p-0.5 rounded transition-colors">
                  <span className="text-slate-600 mr-2">[{l.timestamp}]</span>
                  <span className={`px-1 py-0.2 rounded mr-2 font-bold text-[9px] uppercase tracking-tighter ${
                    l.type === "warning" ? "bg-rose-500/15 text-rose-400" :
                    l.type === "success" ? "bg-emerald-500/15 text-emerald-400" :
                    l.type === "ai" ? "bg-indigo-500/15 text-indigo-400" : "bg-slate-900 text-slate-400"
                  }`}>
                    {l.source}
                  </span>
                  <span className={l.type === "warning" ? "text-amber-300" : l.type === "success" ? "text-emerald-300" : l.type === "ai" ? "text-indigo-200 font-serif" : "text-slate-300"}>
                    {l.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= RIGHT SIDEBAR: INTELLIGENT AI OPTIMIZER ================= */}
        <section className="col-span-12 lg:col-span-3 bg-slate-950 flex flex-col overflow-y-auto max-h-[calc(100vh-4rem)]">
          
          {/* AI Cognitive Tune Center */}
          <div className="p-6 flex flex-col flex-1">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sky-400" />
                Intelligent AP Optimizer
              </h2>
              {isAiApplied && (
                <span className="text-[9px] font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  AP SYNCED
                </span>
              )}
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
              Our embedded AI models observe live packet latency parameters, identify RF interference clusters, and provide self-optimization router shifts.
            </p>

            {/* Force Tune Button */}
            <button
              onClick={handleForceLatencyReTune}
              disabled={aiLoading}
              className={`w-full py-3.5 px-4 rounded-sm font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                aiLoading 
                  ? "bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed" 
                  : "bg-sky-600 text-slate-950 hover:bg-sky-500 shadow-lg shadow-sky-500/10"
              }`}
            >
              {aiLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-slate-600 border-t-slate-300 animate-spin" />
                  ANALYSING RF SPECTRUM...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  Force Latency Re-Tune
                </>
              )}
            </button>

            {/* Optimization Status Display Box */}
            {aiError && (
              <div className="mt-4 p-4 rounded border border-rose-500/30 bg-rose-500/5 text-rose-300 text-xs">
                <p className="font-bold mb-1 uppercase tracking-wider">Analysis Link Dropped</p>
                <p>{aiError}</p>
                <p className="mt-2 text-[10px] text-slate-500 leading-normal">
                  Ensure process key is properly structured in Secrets panel or retry transmission.
                </p>
              </div>
            )}

            {/* Successful AI Advice Display */}
            {aiReport ? (
              <div className="mt-5 space-y-4 flex-1 flex flex-col justify-between">
                
                <div className="space-y-4">
                  {/* Diagnosis header */}
                  <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-4">
                    <div className="flex justify-between items-center border-b border-slate-800/80 pb-2 mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Diagnosis Alert</span>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        aiReport.severity === "CRITICAL" ? "bg-rose-500/15 text-rose-400" :
                        aiReport.severity === "DEGRADED" ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"
                      }`}>
                        {aiReport.severity}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-100 font-mono text-left leading-normal">
                      {aiReport.diagnosis}
                    </h3>
                    <p className="text-[10px] text-slate-400 italic mt-2 text-left leading-normal font-serif">
                      "{aiReport.rootCause}"
                    </p>
                  </div>

                  {/* Recommendation Actions list */}
                  <div className="space-y-2 text-xs">
                    <div className="text-[9px] uppercase font-bold tracking-wider text-slate-500 font-mono">
                      Recommended Tuning Parameters
                    </div>
                    
                    <div className="bg-slate-950 rounded border border-slate-800 p-3 space-y-2.5 font-mono text-[11px]">
                      <div className="flex justify-between border-b border-slate-900 pb-1.5">
                        <span className="text-slate-500">Frequency Band</span>
                        <span className="text-sky-400 font-bold">{aiReport.recommendedConfig.frequencyBand}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-1.5">
                        <span className="text-slate-500">Optimum Channel</span>
                        <span className="text-sky-400 font-bold">Ch {aiReport.recommendedConfig.channel}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-1.5">
                        <span className="text-slate-500">Channel Width</span>
                        <span className="text-sky-400 font-bold">{aiReport.recommendedConfig.channelWidthMz} MHz</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-1.5">
                        <span className="text-slate-500">Transmit Power</span>
                        <span className="text-sky-400 font-bold">{aiReport.recommendedConfig.txPowerDbm} dBm</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-1.5">
                        <span className="text-slate-500">MAC Schedule Prior</span>
                        <span className="text-emerald-400 font-bold">{aiReport.recommendedConfig.qosPriority}</span>
                      </div>
                    </div>
                  </div>

                  {/* Reasons detailed blocks */}
                  {aiReport.reasons && aiReport.reasons.length > 0 && (
                    <div className="space-y-1 text-[11px] leading-relaxed text-slate-400 bg-indigo-950/10 border border-indigo-900/20 p-3 rounded-lg">
                      <div className="text-[9px] uppercase font-bold tracking-wider text-indigo-300 font-mono mb-1">
                        Reasoning Breakdown
                      </div>
                      <ul className="list-disc pl-3.5 space-y-1 select-text">
                        {aiReport.reasons.map((r, idx) => (
                          <li key={idx}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>

                {/* Confirm Apply Recommendation Option */}
                <div className="pt-4 border-t border-slate-800 mt-4">
                  <button
                    onClick={applyAiRecommendation}
                    disabled={isAiApplied}
                    className={`w-full py-3 px-4 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isAiApplied 
                        ? "bg-slate-900 text-emerald-400 border border-emerald-500/20" 
                        : "bg-emerald-600 text-slate-950 hover:bg-emerald-500 font-mono shadow-md shadow-emerald-500/5"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {isAiApplied ? "SETTINGS INTEGRATED" : "APPLY AI RECOMMENDATIONS"}
                  </button>
                  <p className="text-[9px] text-slate-500 text-center mt-2 leading-tight">
                    Injecting optimized profile automatically converges latency & signal masks to standard targets.
                  </p>
                </div>

              </div>
            ) : (
              /* Waiting Screen placeholder */
              <div className="mt-5 flex-1 border border-dashed border-slate-800/80 rounded flex flex-col items-center justify-center p-6 text-center text-slate-500">
                <Sparkles className="w-8 h-8 opacity-30 mb-2.5 text-sky-400 animate-pulse" />
                <p className="text-xs font-semibold uppercase text-slate-400">Neural Optimization Sandbox Ready</p>
                <p className="text-[10px] mt-1 text-slate-500 leading-normal max-w-xs">
                  Create obstacles or Stress triggers in the left console, then force a latency re-tune response.
                </p>
              </div>
            )}

          </div>

          {/* Core Optimization statistics bar */}
          <div className="p-6 border-t border-slate-800/80 bg-slate-900/30 mt-auto">
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-sky-500 mb-4 font-bold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              Resource Allocation Balance
            </h2>
            
            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between text-[10px] mb-1 font-bold font-mono">
                  <span className="uppercase text-slate-400">Channel Efficiency</span>
                  <span className={currentTelemetry.packetLoss < 1 ? "text-emerald-400" : "text-amber-400"}>
                    {Math.round(100 - currentTelemetry.packetLoss * 10)}%
                  </span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      currentTelemetry.packetLoss < 1 ? "bg-sky-500" : "bg-amber-500"
                    }`} 
                    style={{ width: `${Math.max(5, Math.min(100, Math.round(100 - currentTelemetry.packetLoss * 10)))}%` }} 
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] mb-1 font-bold font-mono">
                  <span className="uppercase text-slate-400">QoS Priority Jitter Safety</span>
                  <span className={currentTelemetry.latency < 30 ? "text-emerald-400" : "text-rose-400"}>
                    {Math.round(Math.max(0, 100 - currentTelemetry.latency * 0.75))}%
                  </span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      currentTelemetry.latency < 30 ? "bg-emerald-500" : "bg-rose-500"
                    }`} 
                    style={{ width: `${Math.round(Math.max(2, Math.min(100, 100 - currentTelemetry.latency * 0.75)))}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer Status Bar - Geometric Balance Style */}
      <footer className="h-8 border-t border-slate-850/80 bg-slate-900 flex items-center justify-between px-6 shrink-0 text-[10px] font-mono text-slate-500">
        <div className="flex gap-6 items-center">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            TELEMETRY: LIVE
          </span>
          <span className="hidden sm:block">AP MODEL: SENS_INTELLIGENT_6000</span>
          <span>AI ENGINE: ACCELERATED</span>
        </div>
        <div className="hidden md:block max-w-sm text-right truncate text-[9px] text-slate-600">
          INTERNSHIP CAPSTONE PROGRAM: WIRELESS & DISTRIBUTED OPTIMIZATION
        </div>
      </footer>

    </div>
  );
}
