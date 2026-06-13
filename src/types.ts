export interface NetworkConfig {
  frequencyBand: string; // "2.4 GHz" | "5 GHz" | "6 GHz"
  channel: number;       // Channel number
  channelWidthMz: number; // 20 | 40 | 80 | 160
  txPowerDbm: number;     // 10 to 30 dBm
  csmaBackoffWindow: string; // "Low" | "Standard" | "High"
  antennaMimo: string;     // "1x1" | "2x2" | "4x4" | "8x8"
  qosPriority: string;     // "FIFO" | "Fair-Queueing" | "Voice-Priority" | "IoT-Thread-Priority"
}

export interface LiveTelemetry {
  latency: number;              // ms
  packetLoss: number;           // %
  throughput: number;           // Mbps
  signalStrength: number;       // dBm
  bandwidthUtilization: number; // %
  connectedDevices: number;     // Node count
}

export interface TelemetryHistoryPoint extends LiveTelemetry {
  timestamp: string; // HH:MM:SS
}

export interface NetworkAnomaly {
  id: string;
  name: string;
  description: string;
  type: "interference" | "cogestion" | "fading" | "rogue";
  effect: {
    latencyMod: number;        // additive latency (ms)
    packetLossMod: number;     // additive packet loss (%)
    throughputMod: number;     // multiplier (e.g. 0.4)
    signalStrengthMod: number; // dBm offset (negative)
    utilizationMod: number;    // % offset
  };
}

export interface NetworkNode {
  id: string;
  name: string;
  type: "sensor" | "actuator" | "mobile" | "gateway" | "ap";
  cluster: "Smart Factory" | "Smart Office" | "User Space" | "Infrastructure";
  x: number;
  y: number;
  status: "active" | "degraded" | "inactive";
  signalStrength: number; // dBm
  latency: number;       // ms
  txRate: number;        // Mbps
}

export interface AIAnalysisReport {
  diagnosis: string;
  severity: "OPTIMAL" | "DEGRADED" | "CRITICAL";
  rootCause: string;
  recommendedConfig: {
    frequencyBand: string;
    channel: number;
    channelWidthMz: number;
    txPowerDbm: number;
    csmaBackoffWindow: string;
    qosPriority: string;
  };
  reasons: string[];
  actions: {
    title: string;
    description: string;
    benefit: string;
  }[];
}

export interface NetworkEventLog {
  id: string;
  timestamp: string;
  type: "info" | "warning" | "success" | "ai";
  message: string;
  source: string;
}
