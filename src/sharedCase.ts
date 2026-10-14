import type { ClueId, SuspectId, VerdictTarget } from "./mystery";
import { culpritOf, rollCulprit, type CulpritId } from "./solution";

export type Seat = {
  id: string;
  name: string;
};

export type TranscriptEntry = {
  id: string;
  suspectId: SuspectId;
  prompt: string;
  answer: string;
};

export type Ballot = {
  playerId: string;
  yes: boolean;
};

export type CaseReason = {
  title: string;
  text: string;
};

export type Accusation = {
  target: VerdictTarget;
  proposerId: string;
  round: number;
  votes: Ballot[];
  reason?: CaseReason;
};

export type Place = {
  playerId: string;
  spot: string;
  seen?: number;
};

const SEATED_MS = 75_000;

export type Pocket = {
  playerId: string;
  examined: string[];
  clues: ClueId[];
  flags: string[];
  used: string[];
  lines: TranscriptEntry[];
};

export type SharedCase = {
  phase: "lobby" | "game";
  culprit?: CulpritId;
  players: Seat[];
  clues: ClueId[];
  flags: string[];
  used: string[];
  examined: string[];
  transcript: TranscriptEntry[];
  verdictTarget: VerdictTarget | null;
  accusation: Accusation | null;
  places: Place[];
  pockets: Pocket[];
};

export type Patch =
  | { type: "join"; player: Seat }
  | { type: "start" }
  | { type: "examine"; stageId: string; playerId: string; clue?: ClueId; flag?: string }
  | {
      type: "file";
      playerId: string;
      examined?: string[];
      clues?: ClueId[];
      flags?: string[];
      used?: string[];
      lines?: TranscriptEntry[];
    }
  | { type: "speak"; entry: TranscriptEntry; grants: string[]; playerId: string }
  | { type: "ask"; entry: TranscriptEntry; playerId: string }
  | { type: "propose"; target: VerdictTarget; playerId: string; reason: CaseReason }
  | { type: "withdraw"; playerId: string }
  | { type: "vote"; playerId: string; yes: boolean }
  | { type: "place"; playerId: string; spot: string }
  | { type: "replay" };

export function emptyCase(players: Seat[], culprit: CulpritId = rollCulprit()): SharedCase {
  return {
    phase: "lobby",
    culprit,
    players,
    clues: [],
    flags: [],
    used: [],
    examined: [],
    transcript: [],
    verdictTarget: null,
    accusation: null,
    places: [],
    pockets: [],
  };
}

function addUnique<T>(current: T[], extra: T[]): T[] {
  const next = [...current];
  for (const item of extra) {
    if (!next.includes(item)) next.push(item);
  }
  return next;
}

function addLines(current: TranscriptEntry[], extra: TranscriptEntry[]) {
  const ids = new Set(current.map((entry) => entry.id));
  return [...current, ...extra.filter((entry) => !ids.has(entry.id))];
}

function pocketOf(pockets: Pocket[], playerId: string): Pocket {
  const mine = pockets.find((pocket) => pocket.playerId === playerId);
  return {
    playerId,
    examined: mine?.examined ?? [],
    clues: mine?.clues ?? [],
    flags: mine?.flags ?? [],
    used: mine?.used ?? [],
    lines: mine?.lines ?? [],
  };
}

function replacePocket(state: SharedCase, pocket: Pocket): SharedCase {
  return {
    ...state,
    pockets: [...state.pockets.filter((item) => item.playerId !== pocket.playerId), pocket],
  };
}

export function applyPatch(state: SharedCase, patch: Patch): SharedCase {
  const current: SharedCase = {
    ...state,
    places: state.places ?? [],
    pockets: state.pockets ?? [],
  };
  switch (patch.type) {
    case "join": {
      const existing = current.players.find((player) => player.id === patch.player.id);
      if (existing) {
        if (existing.name === patch.player.name) return current;
        return {
          ...current,
          players: current.players.map((player) => (player.id === patch.player.id ? patch.player : player)),
        };
      }
      if (current.players.length >= 4) return current;
      return { ...current, players: [...current.players, patch.player] };
    }
    case "start":
      return { ...current, phase: "game" };
    case "examine": {
      if (current.examined.includes(patch.stageId)) return current;
      const mine = pocketOf(current.pockets, patch.playerId);
      if (mine.examined.includes(patch.stageId)) return current;
      return replacePocket(current, {
        ...mine,
        examined: [...mine.examined, patch.stageId],
        clues: patch.clue ? addUnique(mine.clues, [patch.clue]) : mine.clues,
        flags: patch.flag ? addUnique(mine.flags, [patch.flag]) : mine.flags,
      });
    }
    case "file": {
      const mine = pocketOf(current.pockets, patch.playerId);
      const examined = addUnique(mine.examined, patch.examined ?? []);
      const clues = addUnique(mine.clues, patch.clues ?? []);
      const flags = addUnique(mine.flags, patch.flags ?? []);
      const used = addUnique(mine.used, patch.used ?? []);
      const lines = addLines(mine.lines, patch.lines ?? []);
      const hasPocket = current.pockets.some((pocket) => pocket.playerId === patch.playerId);
      if (!hasPocket && lines.length === 0 && flags.length === 0 && clues.length === 0 && examined.length === 0) {
        return current;
      }
      return {
        ...current,
        examined: addUnique(current.examined, examined),
        clues: addUnique(current.clues, clues),
        flags: addUnique(current.flags, flags),
        used: addUnique(current.used, used),
        transcript: addLines(current.transcript, lines),
        pockets: current.pockets.filter((pocket) => pocket.playerId !== patch.playerId),
      };
    }
    case "speak": {
      if (current.used.includes(patch.entry.id)) return current;
      const mine = pocketOf(current.pockets, patch.playerId);
      if (mine.used.includes(patch.entry.id)) return current;
      return replacePocket(current, {
        ...mine,
        used: [...mine.used, patch.entry.id],
        flags: addUnique(mine.flags, patch.grants),
        lines: addLines(mine.lines, [patch.entry]),
      });
    }
    case "ask": {
      if (current.transcript.some((entry) => entry.id === patch.entry.id)) return current;
      const mine = pocketOf(current.pockets, patch.playerId);
      if (mine.lines.some((entry) => entry.id === patch.entry.id)) return current;
      return replacePocket(current, {
        ...mine,
        lines: addLines(mine.lines, [patch.entry]),
      });
    }
    case "propose": {
      if (current.verdictTarget || current.accusation) return current;
      const title = patch.reason?.title?.trim() ?? "";
      const text = patch.reason?.text?.trim() ?? "";
      if (!title || !text) return current;
      return settleAccusation({
        ...current,
        accusation: {
          target: patch.target,
          proposerId: patch.playerId,
          round: 1,
          votes: [],
          reason: { title, text },
        },
      });
    }
    case "withdraw": {
      if (!current.accusation || current.verdictTarget || current.accusation.proposerId !== patch.playerId) return current;
      return { ...current, accusation: null };
    }
    case "vote":
      return addVote(current, patch.playerId, patch.yes);
    case "place": {
      const now = Date.now();
      const existing = current.places.find((place) => place.playerId === patch.playerId);
      if (
        existing?.spot === patch.spot &&
        typeof existing.seen === "number" &&
        now - existing.seen < 15_000 &&
        !current.accusation
      ) {
        return current;
      }
      const next: SharedCase = {
        ...current,
        places: [
          ...current.places.filter((place) => place.playerId !== patch.playerId),
          { playerId: patch.playerId, spot: patch.spot, seen: now },
        ],
      };
      return current.accusation ? settleAccusation(next, now) : next;
    }
    case "replay":
      return {
        ...emptyCase(state.players, rollCulprit(culpritOf(state))),
        phase: "game",
      };
    default:
      return state;
  }
}

function isSeated(places: Place[], playerId: string, now: number) {
  const place = places.find((item) => item.playerId === playerId);
  if (!place || place.spot === "away") return false;
  if (typeof place.seen !== "number") return true;
  return now - place.seen <= SEATED_MS;
}

export function seatedOthers(players: Seat[], places: Place[], proposerId: string, now = Date.now()) {
  return players.filter((player) => player.id !== proposerId && isSeated(places, player.id, now));
}

function addVote(state: SharedCase, playerId: string, yes: boolean): SharedCase {
  const accusation = state.accusation;
  if (state.verdictTarget || !accusation || playerId === accusation.proposerId) return state;
  const now = Date.now();
  if (!seatedOthers(state.players, state.places, accusation.proposerId, now).some((player) => player.id === playerId)) {
    return state;
  }
  if (accusation.votes.some((vote) => vote.playerId === playerId)) return state;
  return settleAccusation(
    {
      ...state,
      accusation: {
        ...accusation,
        votes: [...accusation.votes, { playerId, yes }],
      },
    },
    now,
  );
}

function settleAccusation(state: SharedCase, now = Date.now()): SharedCase {
  const accusation = state.accusation;
  if (!accusation || state.verdictTarget) return state;
  const voters = seatedOthers(state.players, state.places, accusation.proposerId, now);
  const ballots = accusation.votes.filter((vote) => voters.some((player) => player.id === vote.playerId));
  if (ballots.length < voters.length) return state;
  const yes = ballots.filter((vote) => vote.yes).length;
  const no = ballots.length - yes;
  if (yes >= no) {
    return { ...state, verdictTarget: accusation.target, accusation: null };
  }
  return {
    ...state,
    accusation: { ...accusation, round: accusation.round + 1, votes: [] },
  };
}

export function roomIsFull(state: SharedCase, playerId: string) {
  return state.players.length >= 4 && !state.players.some((player) => player.id === playerId);
}
