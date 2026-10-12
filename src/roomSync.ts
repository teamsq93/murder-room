import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { applyPatch, type Patch, type SharedCase } from "./sharedCase";
import type { SuspectId } from "./mystery";

const PLAYER_KEY = "murder-room-player";
let memoryPlayerId = "";

export function isSupabaseConfigured() {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

let client: SupabaseClient | null = null;

function supabase() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase är inte konfigurerat.");
  }
  if (!client) {
    client = createClient(url, key);
  }
  return client;
}

export function getPlayerId() {
  try {
    const existing = sessionStorage.getItem(PLAYER_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem(PLAYER_KEY, id);
    return id;
  } catch {
    if (!memoryPlayerId) memoryPlayerId = crypto.randomUUID();
    return memoryPlayerId;
  }
}

type RoomRow = {
  state: SharedCase;
  version: number;
};

export async function createRemoteRoom(code: string, state: SharedCase) {
  const { error } = await supabase().from("rooms").insert({ code, version: 1, state });
  if (error) {
    if (error.code === "23505") throw new Error("Koden fanns redan. Försök igen.");
    throw new Error("Kunde inte skapa rummet.");
  }
  return { state, version: 1 };
}

export async function pushPatch(code: string, patch: Patch) {
  const db = supabase();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data: row, error } = await db.from("rooms").select("state, version").eq("code", code).single();
    if (error || !row) throw new Error("Rummet finns inte längre.");
    const current = row as RoomRow;
    const next = applyPatch(current.state, patch);
    if (patch.type === "join" && !next.players.some((player) => player.id === patch.player.id)) {
      throw new Error("Rummet är fullt.");
    }
    if (JSON.stringify(next) === JSON.stringify(current.state)) {
      return { state: next, version: current.version };
    }
    const { data: updated, error: updateError } = await db
      .from("rooms")
      .update({ state: next, version: current.version + 1 })
      .eq("code", code)
      .eq("version", current.version)
      .select("state, version")
      .maybeSingle();
    if (updateError) throw new Error("Kunde inte synka rummet.");
    if (updated) return { state: (updated as RoomRow).state, version: (updated as RoomRow).version };
  }
  throw new Error("Kunde inte synka rummet. Försök igen.");
}

export async function askRemote(
  code: string,
  body: { suspectId: SuspectId; question: string; name: string },
) {
  const { data, error } = await supabase().functions.invoke("interrogate", {
    body: { code, ...body },
  });
  if (error || !data || typeof data !== "object" || !("state" in data) || !("version" in data)) {
    throw new Error("Förhöret gick inte fram.");
  }
  const saved = data as { state: SharedCase; version: number };
  return { state: saved.state, version: saved.version };
}

export async function loadRoom(code: string) {
  const { data, error } = await supabase().from("rooms").select("state, version").eq("code", code).maybeSingle();
  if (error) throw new Error("Kunde inte öppna rummet.");
  if (!data) return null;
  return data as RoomRow;
}

export function subscribeRoom(code: string, onChange: (state: SharedCase, version: number) => void) {
  const db = supabase();
  let cancelled = false;
  void db
    .from("rooms")
    .select("state, version")
    .eq("code", code)
    .maybeSingle()
    .then(({ data }) => {
      if (cancelled || !data) return;
      const row = data as RoomRow;
      onChange(row.state, row.version);
    });

  const channel = db
    .channel(`room:${code}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "rooms", filter: `code=eq.${code}` },
      (payload) => {
        const row = payload.new as RoomRow;
        onChange(row.state, row.version);
      },
    )
    .subscribe();

  return () => {
    cancelled = true;
    void db.removeChannel(channel);
  };
}
