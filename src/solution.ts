export type CulpritId = "victoria" | "edward" | "clara" | "thomas";

const NIGHTS: CulpritId[] = ["victoria", "edward", "clara", "thomas"];

let current: CulpritId = "thomas";

export function getCulprit(): CulpritId {
  return current;
}

export function setCulprit(next: CulpritId) {
  current = next;
}

export function rollCulprit(except?: CulpritId): CulpritId {
  const pool = except ? NIGHTS.filter((id) => id !== except) : NIGHTS;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index] ?? "thomas";
}

export function culpritOf(state: { culprit?: string | null }): CulpritId {
  if (state.culprit === "victoria" || state.culprit === "edward" || state.culprit === "clara" || state.culprit === "thomas") {
    return state.culprit;
  }
  return "thomas";
}
