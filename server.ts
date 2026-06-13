import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client to prevent crash if key is missing on startup
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// AI optimization endpoint
app.post("/api/network/analyze", async (req, res) => {
  try {
    const { metrics, config } = req.body;

    if (!metrics || !config) {
      return res.status(400).json({ error: "Missing telemetry or configuration data." });
    }

    const ai = getGeminiClient();

    const prompt = `
You are an expert AI-driven Wi-Fi, 5G, and IoT network performance engineer.
Analyze the following telemetry metrics and current physical/logical configuration of the network:

Telemetry Metrics:
- Latency (Current): ${metrics.latency} ms (Target is < 30ms for standard IoT, < 15ms for time-sensitive IoT)
- Packet Loss: ${metrics.packetLoss}% (Target is < 1% for standard, < 0.1% for time-sensitive IoT)
- Throughput: ${metrics.throughput} Mbps (Actual bandwidth transfer)
- Signal Strength (RSSI): ${metrics.signalStrength} dBm (Perfect: -30 to -50dBm, Degraded: -75 to -85dBm, Bad: < -85dBm)
- Bandwidth Utilization: ${metrics.bandwidthUtilization}%
- Connected IoT Devices: ${metrics.connectedDevices} nodes
- Triggered Physical Events/Anomalies: ${JSON.stringify(metrics.activeAnomalies)}

Current Router & Queue configuration:
- Channel: ${config.channel}
- Frequency Band: ${config.frequencyBand}
- Channel Width: ${config.channelWidthMz} MHz
- Tx Power: ${config.txPowerDbm} dBm (Transmit power)
- CSMA/CA Backoff Exponential Window: ${config.csmaBackoffWindow}
- Antenna MIMO Configuration: ${config.antennaMimo}
- QoS Priority Policy: ${config.qosPriority}

Analyze the data. You must detect the latent pattern, deduce the primary network bottleneck (e.g., microwave oven 2.4G physical interference, packet queue tail-drop congestion on default FIFO, multipath fading from physical barrier, IoT sensor storm causing random access CSMA collision), and devise the optimal network adaptation settings.

Formulate an optimized system config suggestion (frequencyBand, channel, channelWidthMz, txPowerDbm, csmaBackoffWindow, qosPriority) that the operator can apply to minimize latency, eliminate packet loss, and boost throughput.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an automated network performance hyper-optimization engine. Your outputs must be highly technical, specific, accurate, and structured in JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diagnosis: {
              type: Type.STRING,
              description: "Brief direct diagnosis summarizing current bottle-necks. Be specific."
            },
            severity: {
              type: Type.STRING,
              description: "One of: OPTIMAL, DEGRADED, CRITICAL"
            },
            rootCause: {
              type: Type.STRING,
              description: "Technical detailed root cause of latency degradation."
            },
            recommendedConfig: {
              type: Type.OBJECT,
              description: "Optimized parameter set designed to lower latency and stabilize the link.",
              properties: {
                frequencyBand: { type: Type.STRING, description: "Switch recommendation: '2.4 GHz', '5 GHz', or '6 GHz'" },
                channel: { type: Type.INTEGER, description: "The single best non-overlapping channel for that band (e.g., 2.4GHz: 1, 6, 11; 5GHz: 36, 44, 149; 6GHz: any standard block)" },
                channelWidthMz: { type: Type.INTEGER, description: "Channel Width: 20, 40, 80, or 160. Note: narrower widths resist interference better; wider offers more throughput." },
                txPowerDbm: { type: Type.INTEGER, description: "Power in dBm (usually 10 to 30. Higher overcomes fading, but increases overlap interference)." },
                csmaBackoffWindow: { type: Type.STRING, description: "Low, Standard, or High backoff window configuration" },
                qosPriority: { type: Type.STRING, description: "Recommended Queue: 'IoT-Thread-Priority', 'Voice-Priority', 'Fair-Queueing', 'FIFO'" }
              },
              required: ["frequencyBand", "channel", "channelWidthMz", "txPowerDbm", "csmaBackoffWindow", "qosPriority"]
            },
            reasons: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Why these parameter changes specifically fix the current physical scenario (e.g. 'switching to 5GHz bypasses the 2.4GHz microwave noise')."
            },
            actions: {
              type: Type.ARRAY,
              description: "List of actionable steps the operator or automated controller should take.",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  benefit: { type: Type.STRING }
                },
                required: ["title", "description", "benefit"]
              }
            }
          },
          required: ["diagnosis", "severity", "rootCause", "recommendedConfig", "reasons", "actions"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from AI assistant");
    }

    const analysis = JSON.parse(resultText);
    res.json(analysis);

  } catch (error: any) {
    console.error("AI Network Analysis Error:", error);
    res.status(500).json({
      error: "Failed to perform AI Network analysis",
      details: error.message
    });
  }
});

// Serve frontend assets
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to bootstrap application:", err);
});
