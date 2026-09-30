import { NextResponse } from "next/server";
import { readSettings } from "@/lib/db";

export async function GET() {
  const settings = readSettings();
  const ollamaUrl = settings.ollamaUrl || process.env.OLLAMA_URL || "http://127.0.0.1:11434";
  const activeModel = settings.ollamaModel || process.env.OLLAMA_MODEL || "qwen3:8b";

  const start = Date.now();
  try {
    const res = await fetch(`${ollamaUrl}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(2000)
    });

    const latency = Date.now() - start;

    if (res.ok) {
      const data = await res.json();
      const models = Array.isArray(data.models) ? data.models.map((m: any) => m.name) : [];
      return NextResponse.json({
        online: true,
        url: ollamaUrl,
        activeModel,
        models,
        latencyMs: latency,
        mode: "Local Ollama"
      });
    }

    return NextResponse.json({
      online: false,
      url: ollamaUrl,
      activeModel,
      models: [],
      latencyMs: latency,
      mode: "Built-in Free Template Engine",
      message: "Ollama responded with an error. Using built-in free template generator."
    });
  } catch (err: any) {
    return NextResponse.json({
      online: false,
      url: ollamaUrl,
      activeModel,
      models: [],
      latencyMs: 0,
      mode: "Built-in Free Template Engine",
      message: "Ollama is not running locally. The built-in free template generator is active and 100% functional with zero API keys."
    });
  }
}
