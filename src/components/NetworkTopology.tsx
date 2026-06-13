import React, { useState, useEffect } from "react";
import { NetworkNode, NetworkConfig } from "../types";
import { 
  Cpu, 
  Wifi, 
  Settings2, 
  Activity, 
  Database, 
  AlertTriangle, 
  Info,
  Server,
  Radio,
  Smartphone,
  Gauge
} from "lucide-react";

interface TopologyProps {
  currentConfig: NetworkConfig;
  activeAnomalies: string[];
  latency: number;
}

export default function NetworkTopology({ currentConfig, activeAnomalies, latency }: TopologyProps) {
  const [nodes, setNodes] = useState<NetworkNode[]>([
    { id: "ap-1", name: "Gateway Core-AP (AX6000)", type: "ap", cluster: "Infrastructure", x: 250, y: 175, status: "active", signalStrength: -30, latency: 1, txRate: 1200 },
    
    // Smart Factory Floor Cluster
    { id: "s-1", name: "Heavy Assembly PLC Sensor", type: "sensor", cluster: "Smart Factory", x: 90, y: 80, status: "active", signalStrength: -62, latency: 4, txRate: 15 },
    { id: "s-2", name: "Pick & Place Robotic Arm", type: "actuator", cluster: "Smart Factory", x: 60, y: 160, status: "active", signalStrength: -58, latency: 6, txRate: 45 },
    { id: "s-3", name: "Vibration Monitor Engine B", type: "sensor", cluster: "Smart Factory", x: 100, y: 260, status: "active", signalStrength: -69, latency: 5, txRate: 11 },
    
    // Smart Office Automation Cluster
    { id: "o-1", name: "Climate Control Master", type: "actuator", cluster: "Smart Office", x: 400, y: 70, status: "active", signalStrength: -54, latency: 12, txRate: 8 },
    { id: "o-2", name: "HVAC Smart Damper", type: "sensor", cluster: "Smart Office", x: 440, y: 140, status: "active", signalStrength: -65, latency: 14, txRate: 12 },
    { id: "o-3", name: "Intelligent Luminance Hub", type: "gateway", cluster: "Smart Office", x: 410, y: 220, status: "active", signalStrength: -51, latency: 9, txRate: 35 },
    
    // User / Guest Space Cluster
    { id: "u-1", name: "Supervisor tablet client", type: "mobile", cluster: "User Space", x: 250, y: 55, status: "active", signalStrength: -45, latency: 8, txRate: 360 },
    { id: "u-2", name: "Smart Security IP-Cam 1", type: "sensor", cluster: "User Space", x: 190, y: 310, status: "active", signalStrength: -70, latency: 18, txRate: 90 },
    { id: "u-3", name: "VoIP Office Phone-Line 2", type: "mobile", cluster: "User Space", x: 310, y: 310, status: "active", signalStrength: -58, latency: 15, txRate: 110 }
  ]);

  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(nodes[0]);

  // Dynamically update nodes physical metrics based on config + active anomalies
  useEffect(() => {
    let baseLossMultiplier = 1;
    let fadingActive = activeAnomalies.includes("fading");
    let interferenceActive = activeAnomalies.includes("interference");
    let stormActive = activeAnomalies.includes("storm");
    let rogueActive = activeAnomalies.includes("rogue");

    setNodes((prevNodes) =>
      prevNodes.map((n) => {
        if (n.type === "ap") {
          return {
            ...n,
            latency: Math.max(1, Math.round(latency * 0.05)),
            status: latency > 150 ? "degraded" : "active"
          };
        }

        // Apply spatial degradation based on cluster type
        let signalOffset = 0;
        let latencyOffset = 0;
        let rateOffset = 1;

        if (n.cluster === "Smart Factory" && fadingActive) {
          // Factory fading
          signalOffset -= 15;
          latencyOffset += 25;
          rateOffset *= 0.45;
        }

        if (n.cluster === "User Space" && interferenceActive) {
          // Microwave or cordless phone overlap (usually 2.4GHz)
          if (currentConfig.frequencyBand === "2.4 GHz") {
            signalOffset -= 22;
            latencyOffset += 95;
            rateOffset *= 0.2;
          } else {
            // High band survives better
            signalOffset -= 4;
            latencyOffset += 10;
            rateOffset *= 0.85;
          }
        }

        if (stormActive) {
          latencyOffset += 45;
          rateOffset *= 0.5;
        }

        if (rogueActive) {
          signalOffset -= 6;
          latencyOffset += 15;
        }

        // Tweak depending on frequency bands
        if (currentConfig.frequencyBand === "5 GHz") {
          // Better rate, slightly lower range penetration
          signalOffset -= 4;
          rateOffset *= 1.5;
        } else if (currentConfig.frequencyBand === "6 GHz") {
          // Zero channel overlap, higher speeds, but high signal drop over distance
          signalOffset -= 8;
          rateOffset *= 2.5;
        }

        // Tweak depending on MIMO setup
        if (currentConfig.antennaMimo === "4x4") {
          rateOffset *= 1.4;
          latencyOffset = Math.max(0, latencyOffset - 5);
        } else if (currentConfig.antennaMimo === "8x8") {
          rateOffset *= 2.0;
          latencyOffset = Math.max(0, latencyOffset - 10);
        }

        // Calculate final signal, latency, rate
        const finalSignal = Math.min(-30, Math.max(-95, n.signalStrength + signalOffset));
        const finalLatency = Math.max(3, Math.round((n.latency + latencyOffset) * (latency / 30)));
        const finalRate = Math.max(1.2, parseFloat((n.txRate * rateOffset).toFixed(1)));

        let status: "active" | "degraded" | "inactive" = "active";
        if (finalSignal < -80 || finalLatency > 120) {
          status = "degraded";
        }
        if (finalSignal < -90) {
          status = "inactive";
        }

        return {
          ...n,
          signalStrength: finalSignal,
          latency: finalLatency,
          txRate: finalRate,
          status
        };
      })
    );
  }, [currentConfig, activeAnomalies, latency]);

  // Synchronize dynamic selectedNode view when nodes list updates
  useEffect(() => {
    if (selectedNode) {
      const match = nodes.find((n) => n.id === selectedNode.id);
      if (match) setSelectedNode(match);
    }
  }, [nodes]);

  const getNodeIcon = (type: string, status: string) => {
    const colorClass = 
      status === "active" ? "text-emerald-400" : 
      status === "degraded" ? "text-amber-400" : "text-rose-400 animate-pulse";

    switch (type) {
      case "ap":
        return <Wifi className={`w-6 h-6 h-6 ${colorClass}`} />;
      case "sensor":
        return <Cpu className={`w-5 h-5 ${colorClass}`} />;
      case "actuator":
        return <Settings2 className={`w-5 h-5 ${colorClass}`} />;
      case "mobile":
        return <Smartphone className={`w-5 h-5 ${colorClass}`} />;
      case "gateway":
        return <Server className={`w-5 h-5 ${colorClass}`} />;
      default:
        return <Radio className={`w-5 h-5 ${colorClass}`} />;
    }
  };

  // Determine link color & speed based on latency
  const getLinkStyle = () => {
    if (latency < 28) {
      return { stroke: "#10b981", strokeWidth: 1.5, speed: "12s" }; // Fast, healthy green
    } else if (latency < 75) {
      return { stroke: "#fbbf24", strokeWidth: 1.5, speed: "22s" }; // Slower yellow
    } else {
      return { stroke: "#f87171", strokeWidth: 2, speed: "40s" }; // Very slow warning red
    }
  };

  const linkStyle = getLinkStyle();

  return (
    <div id="network-topology-container" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col h-full shadow-2xl relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 z-10">
        <div>
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
            Live Network Topology Map
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Visual workspace of wireless IoT client grids & active transmission lines
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-slate-300 font-mono text-[10px]">REAL-TIME SYNC</span>
        </div>
      </div>

      {/* Topology Main Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 z-10 min-h-[360px]">
        
        {/* Interactive SVG Stage */}
        <div className="lg:col-span-2 bg-slate-950/40 rounded-xl border border-slate-800/50 p-2 flex items-center justify-center relative overflow-hidden min-h-[300px]">
          {/* Anomaly hot spot visualization overlay */}
          {activeAnomalies.includes("interference") && (
            <div className="absolute top-[50px] left-[150px] w-32 h-32 bg-amber-500/10 rounded-full border border-dashed border-amber-500/20 blur-[1px] animate-pulse pointer-events-none flex items-center justify-center">
              <span className="text-[9px] text-amber-500/40 tracking-wider font-mono">2.4G JAMMING</span>
            </div>
          )}
          {activeAnomalies.includes("fading") && (
            <div className="absolute top-[80px] left-[30px] w-48 h-12 bg-slate-500/10 rounded-lg border border-dashed border-slate-500/30 blur-[1px] rotate-12 pointer-events-none flex items-center justify-center">
              <span className="text-[10px] text-slate-400/40 tracking-wider font-mono">STEEL BARRIER (FADING)</span>
            </div>
          )}

          <svg viewBox="0 0 500 360" className="w-full h-full max-h-[380px] select-none">
            {/* Connection Paths to AP */}
            {nodes.map((n) => {
              if (n.type === "ap") return null;
              
              // AP coordinates are static at (250, 175)
              const ap = nodes[0];
              const isSelected = selectedNode?.id === n.id;
              
              return (
                <g key={`link-${n.id}`}>
                  {/* Outer glow line */}
                  <line 
                    x1={n.x} 
                    y1={n.y} 
                    x2={ap.x} 
                    y2={ap.y} 
                    stroke={isSelected ? "#6366f1" : linkStyle.stroke} 
                    strokeOpacity={isSelected ? 0.3 : 0.1}
                    strokeWidth={isSelected ? 4 : 2}
                  />
                  {/* Dynamic pulsed animated line */}
                  <line 
                    x1={n.x} 
                    y1={n.y} 
                    x2={ap.x} 
                    y2={ap.y} 
                    stroke={isSelected ? "#818cf8" : linkStyle.stroke} 
                    strokeWidth={isSelected ? linkStyle.strokeWidth + 1 : linkStyle.strokeWidth}
                    strokeDasharray="6, 8"
                    strokeDashoffset="100"
                    style={{
                      animation: `dash ${linkStyle.speed} linear infinite`
                    }}
                  />
                </g>
              );
            })}

            {/* Nodes group representing connections */}
            {nodes.map((n) => {
              const isAP = n.type === "ap";
              const isSelected = selectedNode?.id === n.id;
              
              // Map state classes
              const borderStroke = isSelected ? "#818cf8" : (isAP ? "#6366f1" : "#334155");
              const fillBg = 
                n.status === "active" ? "#0f172a" :
                n.status === "degraded" ? "#1e1b1d" : "#1c0d12";

              return (
                <g 
                  key={n.id} 
                  className="cursor-pointer group" 
                  onClick={() => setSelectedNode(n)}
                >
                  {/* Orbit Glow Ring for AP / Active */}
                  {isAP && (
                    <circle 
                      cx={n.x} 
                      cy={n.y} 
                      r={24} 
                      fill="none" 
                      stroke="#818cf8" 
                      strokeOpacity="0.12" 
                      strokeWidth="2" 
                      className="animate-ping"
                      style={{ animationDuration: "3s" }}
                    />
                  )}

                  {/* Node trigger point base */}
                  <circle 
                    cx={n.x} 
                    cy={n.y} 
                    r={isAP ? 18 : 13} 
                    fill={fillBg} 
                    stroke={borderStroke} 
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    className="transition-all duration-300 hover:scale-110 ease-out"
                  />

                  {/* Icon Embedding */}
                  <foreignObject 
                    x={n.x - (isAP ? 11 : 9)} 
                    y={n.y - (isAP ? 11 : 9)} 
                    width={isAP ? 22 : 18} 
                    height={isAP ? 22 : 18} 
                    className="pointer-events-none"
                  >
                    <div className="flex items-center justify-center w-full h-full">
                      {getNodeIcon(n.type, n.status)}
                    </div>
                  </foreignObject>

                  {/* Dynamic Status Badges for Anomalies */}
                  {n.status === "degraded" && !isAP && (
                    <circle 
                      cx={n.x + 9} 
                      cy={n.y - 9} 
                      r={4.5} 
                      fill="#fbbf24" 
                      stroke="#0f172a" 
                      strokeWidth="1"
                    />
                  )}
                  {n.status === "inactive" && !isAP && (
                    <circle 
                      cx={n.x + 9} 
                      cy={n.y - 9} 
                      r={4.5} 
                      fill="#ef4444" 
                      stroke="#0f172a" 
                      strokeWidth="1"
                    />
                  )}

                  {/* Adaptive Text Label spacing */}
                  <text 
                    x={n.x} 
                    y={n.y + (isAP ? 28 : 22)} 
                    textAnchor="middle" 
                    className={`font-sans font-medium text-[8px] transition-colors duration-200 ${
                      isSelected ? "fill-indigo-300 text-[9px] font-semibold" : "fill-slate-400 group-hover:fill-slate-300"
                    }`}
                  >
                    {n.type === "ap" ? "GATEWAY CORE" : n.name.split(" ")[0]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Node Inspector Pane */}
        <div className="bg-slate-950/50 rounded-xl border border-slate-800/80 p-5 flex flex-col justify-between">
          {selectedNode ? (
            <div className="h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 mb-3">
                  <span className="p-1.5 bg-slate-900 rounded-lg border border-slate-800">
                    {getNodeIcon(selectedNode.type, selectedNode.status)}
                  </span>
                  <div>
                    <h3 className="font-semibold text-slate-100 text-sm tracking-tight leading-none">
                      {selectedNode.name}
                    </h3>
                    <span className="text-[10px] text-indigo-400 uppercase font-mono tracking-wider mt-1 block">
                      {selectedNode.cluster} Cluster
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mt-4 text-xs font-mono">
                  <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/50 flex justify-between items-center">
                    <span className="text-slate-400 font-sans text-[11px]">Node Device ID:</span>
                    <span className="text-slate-200 text-[11px] font-bold">{selectedNode.id.toUpperCase()}</span>
                  </div>

                  <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/50 flex justify-between items-center">
                    <span className="text-slate-400 font-sans text-[11px]">Link Status:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      selectedNode.status === "active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      selectedNode.status === "degraded" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                      "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}>
                      {selectedNode.status}
                    </span>
                  </div>

                  <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/50 flex justify-between items-center">
                    <span className="text-slate-400 font-sans text-[11px]">Signal (RSSI):</span>
                    <span className={`font-bold ${
                      selectedNode.signalStrength > -55 ? "text-emerald-400" :
                      selectedNode.signalStrength > -75 ? "text-amber-400" : "text-rose-400"
                    }`}>
                      {selectedNode.signalStrength} dBm
                    </span>
                  </div>

                  <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/50 flex justify-between items-center">
                    <span className="text-slate-400 font-sans text-[11px]">Segment Latency:</span>
                    <span className={`font-bold ${
                      selectedNode.latency < 20 ? "text-emerald-400" :
                      selectedNode.latency < 60 ? "text-amber-400" : "text-rose-400"
                    }`}>
                      {selectedNode.latency} ms
                    </span>
                  </div>

                  {selectedNode.type !== "ap" && (
                    <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/50 flex justify-between items-center">
                      <span className="text-slate-400 font-sans text-[11px]">Negotiated PHY Rate:</span>
                      <span className="text-indigo-400 font-bold">{selectedNode.txRate} Mbps</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Technical Tip context */}
              <div className="bg-indigo-950/20 rounded-lg p-3 border border-indigo-900/30 text-[11px] text-indigo-300 mt-4 leading-relaxed flex gap-2">
                <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  {selectedNode.status === "active" 
                    ? "Link is operating within structural QoS targets. Jitter is stabilized."
                    : selectedNode.status === "degraded"
                    ? "Link latency is exceeding limits due to RF structural attenuation or frequency channel congestion. Optimize via router bands."
                    : "Node is disconnected. Transmission failure due to severe interference. Increase signal booster or switch bands."
                  }
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Radio className="w-8 h-8 opacity-40 mb-2" />
              <p className="text-xs">Click a node on the canvas to inspect real-time transmission logs</p>
            </div>
          )}
        </div>

      </div>

      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
