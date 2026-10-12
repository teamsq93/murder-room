import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { allowedBrief, answerIsSafe, answerSuspect, isVoiceSuspect, type VoiceInput } from "./voice.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

type RoomState = {
  phase: "lobby" | "game";
  clues: string[];
  flags: string[];
  transcript: { id: string; suspectId: string; prompt: string; answer: string }[];
  verdictTarget: string | null;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "Fel metod." }, 405);
  if (!authorized(request)) return json({ error: "Förhöret gick inte fram." }, 401);

  let body: { code?: unknown; suspectId?: unknown; question?: unknown; name?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Frågan gick inte att läsa." }, 400);
  }

  const code = String(body.code ?? "").trim().toUpperCase();
  const suspectId = String(body.suspectId ?? "");
  const question = String(body.question ?? "").trim().slice(0, 280);
  const name = String(body.name ?? "").trim().slice(0, 24);
  if (!/^[A-Z0-9]{4,8}$/.test(code) || !isVoiceSuspect(suspectId) || question.length < 2) {
    return json({ error: "Frågan är inte giltig." }, 400);
  }

  const db = admin();
  if (!db) return json({ error: "Förhöret gick inte fram." }, 500);
  const entryId = `ask-${crypto.randomUUID()}`;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data: row, error } = await db.from("rooms").select("state, version").eq("code", code).maybeSingle();
    if (error || !row) return json({ error: "Rummet finns inte." }, 404);
    const state = row.state as RoomState;
    const version = row.version as number;
    if (state.phase !== "game" || state.verdictTarget) {
      return json({ error: "Förhöret är stängt." }, 409);
    }
    if (state.transcript.some((line) => line.id === entryId)) {
      return json({ state, version });
    }

    const voice: VoiceInput = {
      suspectId,
      question,
      name,
      clues: state.clues ?? [],
      flags: state.flags ?? [],
      transcript: state.transcript ?? [],
    };
    const answer = await compose(voice);
    const next = {
      ...state,
      transcript: [
        ...(state.transcript ?? []),
        { id: entryId, suspectId, prompt: question, answer },
      ],
    };
    const { data: updated, error: updateError } = await db
      .from("rooms")
      .update({ state: next, version: version + 1 })
      .eq("code", code)
      .eq("version", version)
      .select("state, version")
      .maybeSingle();
    if (updateError) return json({ error: "Förhöret gick inte fram." }, 500);
    if (updated) return json({ state: updated.state, version: updated.version });
  }

  return json({ error: "Förhöret gick inte fram. Försök igen." }, 409);
});

async function compose(input: VoiceInput) {
  const ruled = answerSuspect(input);
  const key = Deno.env.get("AI_API_KEY");
  if (!key) return ruled;
  try {
    const base = (Deno.env.get("AI_BASE_URL") ?? "https://api.openai.com/v1").replace(/\/$/, "");
    const model = Deno.env.get("AI_MODEL") ?? "gpt-4o-mini";
    const response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(12000),
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 180,
        messages: [
          { role: "system", content: allowedBrief(input) },
          { role: "user", content: input.question },
        ],
      }),
    });
    if (!response.ok) return ruled;
    const payload = await response.json();
    const text = payload?.choices?.[0]?.message?.content;
    if (typeof text !== "string") return ruled;
    const cleaned = text.trim();
    return answerIsSafe(cleaned, allowedBrief(input)) ? cleaned : ruled;
  } catch {
    return ruled;
  }
}

function authorized(request: Request) {
  const apikey = request.headers.get("apikey") ?? "";
  if (!apikey) return false;
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (anon && apikey === anon) return true;
  return listed(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")).includes(apikey);
}

function admin() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = named(Deno.env.get("SUPABASE_SECRET_KEYS"), "default") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function named(raw: string | undefined, name: string) {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && name in parsed) {
      const value = (parsed as Record<string, unknown>)[name];
      return typeof value === "string" ? value : "";
    }
  } catch {
    return "";
  }
  return "";
}

function listed(raw: string | undefined) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object") {
      return Object.values(parsed).filter((value): value is string => typeof value === "string");
    }
  } catch {
    return [raw];
  }
  return [];
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: cors });
}
