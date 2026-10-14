import { useEffect, useRef, useState } from "react";
import "./App.css";
import { ManorView } from "./ManorView";
import { MusicControl } from "./MusicControl";
import { HOUSE_FLAGS, type Stage } from "./manor";
import {
  CLUES,
  SUSPECTS,
  availableChoices,
  eveningTimeline,
  roomsThatOpenQuestions,
  timelineClashes,
  judge,
  notesFor,
  suspectMood,
  cluePresentation,
  type Mood,
  type Choice,
  type ClueId,
  type InquiryState,
  type SuspectId,
  type VerdictTarget,
} from "./mystery";
import {
  createRemoteRoom,
  getPlayerId,
  isSupabaseConfigured,
  loadRoom,
  pushPatch,
  subscribeRoom,
} from "./roomSync";
import { setLang, speak as localize, tr, tx, useLang } from "./locale";
import { culpritOf, rollCulprit, setCulprit, type CulpritId } from "./solution";
import { answerSuspect } from "./voice";
import {
  applyPatch,
  emptyCase,
  roomIsFull,
  seatedOthers,
  type Accusation,
  type CaseReason,
  type Patch,
  type Place,
  type Pocket,
  type Seat,
  type SharedCase,
  type TranscriptEntry,
} from "./sharedCase";

type Player = {
  name: string;
  role: string;
  online: boolean;
};

const initialPlayers: Player[] = [
  { name: "Du", role: "Utredare", online: true },
  { name: "Väntar på spelare", role: "Utredare", online: false },
  { name: "Väntar på spelare", role: "Utredare", online: false },
  { name: "Väntar på spelare", role: "Utredare", online: false },
];

function accusedLabel(target: VerdictTarget) {
  if (target === "none") return "ingen";
  return SUSPECTS.find((suspect) => suspect.id === target)?.name ?? "den anklagade";
}

function createRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function seatsToPlayers(seats: SharedCase["players"]): Player[] {
  const filled: Player[] = seats.slice(0, 4).map((seat) => ({
    name: seat.name,
    role: "Utredare",
    online: true,
  }));
  while (filled.length < 4) {
    filled.push({ name: "Väntar på spelare", role: "Utredare", online: false });
  }
  return filled;
}

function App() {
  const lang = useLang();
  const [screen, setScreen] = useState<"home" | "lobby" | "game">("home");
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [players, setPlayers] = useState(initialPlayers);
  const [clues, setClues] = useState<ClueId[]>([]);
  const [flags, setFlags] = useState<string[]>([]);
  const [used, setUsed] = useState<string[]>([]);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [selectedSuspect, setSelectedSuspect] = useState<SuspectId | null>(null);
  const [verdictTarget, setVerdictTarget] = useState<VerdictTarget | null>(null);
  const [accusation, setAccusation] = useState<Accusation | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [accuseOpen, setAccuseOpen] = useState(false);
  const [pendingAccusation, setPendingAccusation] = useState<VerdictTarget | null>(null);
  const [pendingReason, setPendingReason] = useState<CaseReason | null>(null);
  const [examined, setExamined] = useState<string[]>([]);
  const [pockets, setPockets] = useState<Pocket[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [mode, setMode] = useState<"manor" | "suspects">("manor");
  const [busy, setBusy] = useState(false);
  const [culprit, setCulpritState] = useState<CulpritId>("thomas");
  setCulprit(culprit);
  const multiplayer = isSupabaseConfigured();
  const snapshotRef = useRef<SharedCase>(emptyCase([]));
  const versionRef = useRef(0);
  const roomCodeRef = useRef("");

  const myId = getPlayerId();
  const pocket = pockets.find((item) => item.playerId === myId);
  const seenClues = [...new Set([...clues, ...(pocket?.clues ?? [])])];
  const seenFlags = [...new Set([...flags, ...(pocket?.flags ?? [])])];
  const seenExamined = [...new Set([...examined, ...(pocket?.examined ?? [])])];
  const seenUsed = [...new Set([...used, ...(pocket?.used ?? [])])];
  const inquiry: InquiryState = { clues: seenClues, flags: seenFlags, used: seenUsed };
  const libraryReady = CLUES.every((clue) => seenClues.includes(clue.id));
  const libraryLeft = CLUES.filter((clue) => !seenClues.includes(clue.id));
  const verdict = verdictTarget ? judge(verdictTarget, inquiry, playerName) : null;
  const heldBack = (pocket?.examined ?? []).filter((stageId) => !examined.includes(stageId));
  const caseStarted =
    clues.length > 0 ||
    transcript.length > 0 ||
    examined.length > 0 ||
    heldBack.length > 0 ||
    verdictTarget !== null;
  const onlineCount = players.filter((player) => player.online).length;
  const displayName = playerName.trim() || "Du";

  function hydrate(next: SharedCase) {
    const night = culpritOf(next);
    setCulprit(night);
    setCulpritState(night);
    snapshotRef.current = next;
    setClues(next.clues);
    setFlags(next.flags);
    setUsed(next.used);
    setExamined(next.examined);
    setPockets(next.pockets ?? []);
    setPlaces(next.places ?? []);
    setTranscript(next.transcript);
    setVerdictTarget(next.verdictTarget);
    setAccusation(next.accusation ?? null);
    setSeats(next.players);
    setPlayers(seatsToPlayers(next.players));
    if (next.accusation) setAccuseOpen(false);
    if (next.verdictTarget) {
      setAccuseOpen(false);
      setPendingAccusation(null);
      setPendingReason(null);
      setSelectedSuspect(null);
    }
  }

  function acceptRemote(next: SharedCase, version: number) {
    if (version < versionRef.current) return;
    const previousPhase = snapshotRef.current.phase;
    versionRef.current = version;
    hydrate(next);
    if (previousPhase === "lobby" && next.phase === "game") {
      setScreen((current) => (current === "home" ? current : "game"));
    }
  }

  async function commit(patch: Patch) {
    const previousPhase = snapshotRef.current.phase;
    const optimistic = applyPatch(snapshotRef.current, patch);
    hydrate(optimistic);
    if (previousPhase === "lobby" && optimistic.phase === "game") {
      setScreen((current) => (current === "home" ? current : "game"));
    }
    const saved = await pushPatch(roomCodeRef.current, patch);
    if (saved.version < versionRef.current) return;
    versionRef.current = saved.version;
    hydrate(saved.state);
    if (previousPhase === "lobby" && saved.state.phase === "game") {
      setScreen((current) => (current === "home" ? current : "game"));
    }
  }

  function currentSpot() {
    if (screen !== "game") return "away";
    if (selectedSuspect) return `talk:${selectedSuspect}`;
    if (mode === "suspects") return "suspects";
    return roomId ?? "manor";
  }

  const spotRef = useRef("away");
  spotRef.current = currentSpot();
  const placeChain = useRef(Promise.resolve());

  function queuePlace() {
    placeChain.current = placeChain.current
      .catch(() => undefined)
      .then(async () => {
        for (let attempt = 0; attempt < 4; attempt += 1) {
          const spot = spotRef.current;
          try {
            await commit({ type: "place", playerId: myId, spot });
          } catch {
            return;
          }
          if (spotRef.current === spot) return;
        }
      });
  }

  useEffect(() => {
    if (libraryReady) return;
    setMode((current) => (current === "manor" ? current : "manor"));
    setSelectedSuspect((current) => (current === null ? current : null));
  }, [libraryReady]);

  useEffect(() => {
    if (!multiplayer || !roomCode) return;
    queuePlace();
  }, [multiplayer, screen, roomCode, selectedSuspect, mode, roomId, myId]);

  useEffect(() => {
    if (!multiplayer || screen !== "game" || !roomCode) return;
    const timer = window.setInterval(() => queuePlace(), 20_000);
    return () => window.clearInterval(timer);
  }, [multiplayer, screen, roomCode, selectedSuspect, mode, roomId, myId]);

  function clearCase() {
    setClues([]);
    setFlags([]);
    setUsed([]);
    setTranscript([]);
    setSelectedSuspect(null);
    setVerdictTarget(null);
    setAccusation(null);
    setSeats([]);
    setAccuseOpen(false);
    setPendingAccusation(null);
    setPendingReason(null);
    setExamined([]);
    setPockets([]);
    setPlaces([]);
    setRoomId(null);
    setMode("manor");
  }

  function enterRoom(code: string) {
    const night = rollCulprit();
    setCulprit(night);
    setCulpritState(night);
    setRoomCode(code);
    roomCodeRef.current = code;
    setPlayers([
      { name: displayName, role: "Utredare", online: true },
      ...initialPlayers.slice(1),
    ]);
    clearCase();
    setError("");
    setCopied(false);
    setScreen("lobby");
  }

  function openSharedRoom(code: string, saved: { state: SharedCase; version: number }) {
    versionRef.current = saved.version;
    roomCodeRef.current = code;
    setRoomCode(code);
    setSelectedSuspect(null);
    setAccuseOpen(false);
    setPendingAccusation(null);
    setPendingReason(null);
    setRoomId(null);
    setMode("manor");
    setError("");
    setCopied(false);
    hydrate(saved.state);
    setScreen(saved.state.phase === "game" ? "game" : "lobby");
  }

  async function createRoom() {
    if (!multiplayer) {
      enterRoom(createRoomCode());
      return;
    }
    setBusy(true);
    setError("");
    try {
      const me = { id: getPlayerId(), name: displayName };
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const code = createRoomCode();
        try {
          const saved = await createRemoteRoom(code, emptyCase([me]));
          openSharedRoom(code, saved);
          return;
        } catch (err) {
          if (attempt === 2) throw err;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte skapa rummet.");
    } finally {
      setBusy(false);
    }
  }

  async function joinRoom() {
    if (joinCode.trim().length < 4) {
      setError("Ange en giltig rumskod.");
      return;
    }
    const code = joinCode.trim().toUpperCase();
    if (!multiplayer) {
      enterRoom(code);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const existing = await loadRoom(code);
      if (!existing) {
        setError("Inget rum med den koden.");
        return;
      }
      const me = { id: getPlayerId(), name: displayName };
      if (roomIsFull(existing.state, me.id)) {
        setError("Rummet är fullt.");
        return;
      }
      const saved = await pushPatch(code, { type: "join", player: me });
      openSharedRoom(code, saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte gå med i rummet.");
    } finally {
      setBusy(false);
    }
  }

  function examine(stage: Stage) {
    if (!multiplayer) {
      setExamined((current) => (current.includes(stage.id) ? current : [...current, stage.id]));
      if (stage.clue) {
        const clueId = stage.clue;
        setClues((current) => (current.includes(clueId) ? current : [...current, clueId]));
      }
      if (stage.flag) {
        const flag = stage.flag;
        setFlags((current) => (current.includes(flag) ? current : [...current, flag]));
      }
      return;
    }
    void commit({ type: "examine", stageId: stage.id, playerId: getPlayerId(), clue: stage.clue, flag: stage.flag }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Kunde inte dela fyndet.");
    });
  }

  function resetGame() {
    clearCase();
    roomCodeRef.current = "";
    versionRef.current = 0;
    setRoomCode("");
    setError("");
    setScreen("home");
  }

  function replayCase() {
    setRoomId(null);
    setMode("manor");
    setSelectedSuspect(null);
    if (!multiplayer) {
      const night = rollCulprit(culprit);
      setCulprit(night);
      setCulpritState(night);
      clearCase();
      setScreen("game");
      return;
    }
    void commit({ type: "replay" }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Kunde inte starta om fallet.");
    });
  }

  async function askFree(question: string) {
    if (!selectedSuspect) return;
    const trimmed = question.trim();
    if (trimmed.length < 2) return;
    const entry: TranscriptEntry = {
      id: `ask-${crypto.randomUUID()}`,
      suspectId: selectedSuspect,
      prompt: trimmed,
      answer: answerSuspect({
        suspectId: selectedSuspect,
        question: trimmed,
        name: playerName,
        clues: seenClues,
        flags: seenFlags,
        transcript,
      }),
    };
    if (!multiplayer) {
      setTranscript((current) => [...current, entry]);
      return;
    }
    try {
      await commit({ type: "ask", entry, playerId: getPlayerId() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Förhöret gick inte fram.");
      throw err;
    }
  }

  function speak(choice: Choice) {
    if (!selectedSuspect) return;
    const result = choice.resolve(inquiry, playerName);
    const entry: TranscriptEntry = {
      id: choice.id,
      suspectId: selectedSuspect,
      prompt: choice.label,
      answer: result.answer,
    };
    if (!multiplayer) {
      setUsed((current) => [...current, choice.id]);
      setFlags((current) => [...new Set([...current, ...result.grants])]);
      setTranscript((current) => [...current, entry]);
      return;
    }
    void commit({ type: "speak", entry, grants: result.grants, playerId: getPlayerId() }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Kunde inte dela förhöret.");
    });
  }

  function confirmAccusation() {
    if (!pendingAccusation || !pendingReason) return;
    if (!multiplayer) {
      setVerdictTarget(pendingAccusation);
      setAccuseOpen(false);
      setPendingAccusation(null);
      setPendingReason(null);
      setSelectedSuspect(null);
      return;
    }
    const target = pendingAccusation;
    const reason = pendingReason;
    setAccuseOpen(false);
    setPendingAccusation(null);
    setPendingReason(null);
    void commit({ type: "propose", target, playerId: getPlayerId(), reason }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Kunde inte lägga fram anklagelsen.");
    });
  }

  function fileFinds() {
    const mine = snapshotRef.current.pockets.find((item) => item.playerId === getPlayerId());
    void commit({
      type: "file",
      playerId: getPlayerId(),
      examined: mine?.examined ?? [],
      clues: mine?.clues ?? [],
      flags: mine?.flags ?? [],
      used: mine?.used ?? [],
      lines: mine?.lines ?? [],
    }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Kunde inte lägga fyndet i akten.");
    });
  }

  function withdrawAccusation() {
    void commit({ type: "withdraw", playerId: getPlayerId() }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Kunde inte ta tillbaka anklagelsen.");
    });
  }

  function castVote(yes: boolean) {
    void commit({ type: "vote", playerId: getPlayerId(), yes }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Rösten gick inte fram.");
    });
  }

  function beginInvestigation() {
    if (!multiplayer) {
      setScreen("game");
      return;
    }
    if (snapshotRef.current.phase === "game") {
      setScreen("game");
      return;
    }
    void commit({ type: "start" }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Kunde inte starta utredningen.");
    });
  }

  const onRemoteRef = useRef(acceptRemote);
  onRemoteRef.current = acceptRemote;

  useEffect(() => {
    if (!multiplayer || !roomCode) return;
    return subscribeRoom(roomCode, (state, version) => onRemoteRef.current(state, version));
  }, [multiplayer, roomCode]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
    } catch {
      setCopied(false);
      setError("Kunde inte kopiera. Markera koden manuellt.");
    }
  }

  const startLabel = verdict
    ? tx("VISA UTFALLET", "SHOW THE OUTCOME")
    : caseStarted
      ? tx("FORTSÄTT UTREDNINGEN", "CONTINUE THE INVESTIGATION")
      : tx("BÖRJA UTREDNINGEN", "BEGIN THE INVESTIGATION");

  function namesAt(spot: string) {
    return places
      .filter((place) => place.spot === spot && place.playerId !== myId)
      .map((place) => seats.find((seat) => seat.id === place.playerId)?.name ?? "")
      .filter((name) => name.length > 0);
  }

  const privateFlags = (pocket?.flags ?? []).filter((flag) => !flags.includes(flag));
  const privateNotes = notesFor({ clues: [], flags: privateFlags, used: [] });
  const privateClues = CLUES.filter((clue) => (pocket?.clues ?? []).includes(clue.id) && !clues.includes(clue.id));
  const sharedNotes = notesFor({ clues, flags, used });
  const reasonChoices: CaseReason[] = [
    ...CLUES.filter((clue) => clues.includes(clue.id)).map((clue) => {
      const face = cluePresentation(clue);
      return { title: face.name, text: face.detail };
    }),
    ...sharedNotes.map((note) => ({ title: note.title, text: note.text })),
  ];
  const known = { clues: seenClues, flags: seenFlags, used: seenUsed };
  const slots = eveningTimeline(known);
  const clashes = timelineClashes(known);
  const ownLines = (pocket?.lines ?? []).filter((line) => !transcript.some((item) => item.id === line.id));
  const visibleTranscript = [...transcript, ...ownLines];
  const holding = heldBack.length > 0 || ownLines.length > 0 || privateNotes.length > 0 || privateClues.length > 0;
  const suspectsHere = namesAt("suspects");

  return (
    <main className={screen === "home" ? "app" : screen === "game" ? "app interior investigation" : "app interior"}>
      <header className="topbar">
        <button className="brand" type="button" onClick={resetGame}>
          <span className="brand-mark">M</span>
          <span>
            MURDER ROOM
            <small>{tx("ETT DECKARSPEL", "A DETECTIVE GAME")}</small>
          </span>
        </button>
        <div className="top-tools">
          <MusicControl />
          <span className="top-status">
            <span className="status-dot" /> {tx("FALL 001", "CASE 001")}
          </span>
        </div>
      </header>

      {screen === "home" && (
        <section className="hero">
          <div className="hero-content">
            <div className="lang-switch" role="group" aria-label={tx("Språk", "Language")}>
              <button type="button" className={lang === "sv" ? "active" : ""} onClick={() => setLang("sv")}>
                SVENSKA
              </button>
              <button type="button" className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>
                ENGLISH
              </button>
            </div>
            <p className="eyebrow">{tx("ETT MORDSPEL FÖR FYRA", "A MURDER GAME FOR FOUR")}</p>
            <h1>
              {tx("ALLA", "EVERYONE")}
              <br />
              {tx("HAR EN ", "HAS A ")}<em>{tx("HEMLIGHET.", "SECRET.")}</em>
            </h1>
            <p className="hero-description">
              {tx(
                "En mördad arvtagare. Fyra misstänkta. En herrgård full av hemligheter. Samla bevis, förhör de misstänkta och ta reda på vem som talar sanning.",
                "A murdered heir. Four suspects. A manor full of secrets. Gather evidence, question the suspects, and find out who is telling the truth.",
              )}
            </p>

            <div className="name-field">
              <label htmlFor="playerName">{tx("DITT UTREDARENAMN", "YOUR INVESTIGATOR NAME")}</label>
              <input
                id="playerName"
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                placeholder={tx("Skriv ditt namn...", "Write your name...")}
                maxLength={24}
                autoComplete="off"
              />
            </div>

            <div className="home-actions">
              <button className="primary-button" type="button" disabled={busy} onClick={() => void createRoom()}>
                {tx("SKAPA SPELRUM", "CREATE A ROOM")} <span>↗</span>
              </button>
              <div className="join-row">
                <input
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") joinRoom();
                  }}
                  placeholder={tx("RUMSKOD", "ROOM CODE")}
                  maxLength={8}
                  aria-label={tx("Rumskod", "Room code")}
                  autoComplete="off"
                />
                <button className="secondary-button" type="button" disabled={busy} onClick={() => void joinRoom()}>
                  {tx("GÅ MED", "JOIN")}
                </button>
              </div>
            </div>
            {error && <p className="error-message">{tr(error)}</p>}
            <p className="fine-print">
              {tx(
                "SAMARBETA MED VÄNNER · FÖLJ LEDTRÅDARNA · AVSLÖJA SANNINGEN",
                "WORK WITH FRIENDS · FOLLOW THE CLUES · UNCOVER THE TRUTH",
              )}
            </p>
            <p className="fine-print">
              {tx(
                "EN NY OMGÅNG KAN HA EN ANNAN GÄRNINGSPERSON.",
                "A NEW ROUND CAN HAVE A DIFFERENT CULPRIT.",
              )}
            </p>
          </div>
          <div className="hero-caption">
            <span>BLACKWOOD MANOR</span>
            <span>{tx("51°30'26.4\"N — PLATSEN ÄR OKÄND", "51°30'26.4\"N — THE PLACE IS UNKNOWN")}</span>
          </div>
        </section>
      )}

      {screen === "lobby" && (
        <section className="content-page">
          <p className="eyebrow">{tx("SPELRUM / FÖRBEREDELSE", "ROOM / PREPARATION")}</p>
          <h1>{tx("UTREDNINGSRUMMET", "THE INVESTIGATION ROOM")}</h1>
          <p className="muted">{tx("Bjud in dina medutredare med rumskoden.", "Invite your fellow investigators with the room code.")}</p>

          <div className="room-code-panel">
            <div>
              <span className="label">{tx("DIN RUMSKOD", "YOUR ROOM CODE")}</span>
              <div className="room-code">{roomCode}</div>
            </div>
            <button className="secondary-button" type="button" onClick={() => void copyCode()}>
              {copied ? tx("KOPIERAD", "COPIED") : tx("KOPIERA KOD", "COPY CODE")}
            </button>
          </div>
          {error && <p className="error-message">{tr(error)}</p>}

          <h2>
            {tx("UTREDARE", "INVESTIGATORS")} <span className="muted">({onlineCount}/4)</span>
          </h2>
          <div className="player-grid">
            {players.map((player, index) => (
              <div className="player-card" key={index}>
                <div className="player-avatar">
                  {player.online ? player.name.slice(0, 1).toUpperCase() : "?"}
                </div>
                <div>
                  <strong>{tr(player.name)}</strong>
                  <p>{tr(player.role)}</p>
                  <span className={player.online ? "online" : "waiting"}>
                    {player.online ? tx("● ANSLUTEN", "● CONNECTED") : tx("○ VÄNTAR", "○ WAITING")}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="notice">
            <strong>{tx("FALL 001 — DÖDEN PÅ BLACKWOOD MANOR", "CASE 001 — DEATH AT BLACKWOOD MANOR")}</strong>
            <p>
              {tx(
                "Ett misstänkt dödsfall har inträffat under en privat middag. Ni har en natt på er att finna sanningen. Samma fall kan sluta på olika sätt beroende på vad ni frågar, och i vilken ton. Varje gång ni börjar om dras en ny gärningsperson, och bevisen följer den natten.",
                "A suspicious death has occurred during a private dinner. You have one night to find the truth. The same case can end in different ways depending on what you ask, and in what tone. Each time you start again, a new culprit is drawn, and the clues follow that night.",
              )}
            </p>
          </div>

          <button className="primary-button" type="button" onClick={beginInvestigation}>
            {startLabel} <span>→</span>
          </button>
          {caseStarted && (
            <button className="secondary-button replay-inline" type="button" onClick={replayCase}>
              {tx("SPELA OM FRÅN BÖRJAN", "PLAY AGAIN FROM THE START")}
            </button>
          )}
          <p className="fine-print">
            {multiplayer
              ? tx(
                  "LIVE-RUM · FYRA SPELARE DELAR SAMMA AKT, SAMMA FÖRHÖR OCH SAMMA SLUT.",
                  "LIVE ROOM · FOUR PLAYERS SHARE THE SAME FILE, THE SAME INTERVIEWS, AND THE SAME ENDING.",
                )
              : tx(
                  "PROTOTYP: DU KAN TESTA UTREDNINGEN INNAN MULTIPLAYER AKTIVERAS.",
                  "PROTOTYPE: YOU CAN TRY THE INVESTIGATION BEFORE MULTIPLAYER IS TURNED ON.",
                )}
          </p>
        </section>
      )}

      {screen === "game" && verdict && (
        <section className="content-page">
          <p className="eyebrow">{tr(verdict.kicker)}</p>
          <h1>{tr(verdict.title)}</h1>
          <div className="ending">
            <p>{localize(verdict.text)}</p>
            <p className="path-summary">{verdict.path}</p>
          </div>
          <div className="ending-actions">
            <button className="primary-button" type="button" onClick={replayCase}>
              {tx("SPELA IGEN", "PLAY AGAIN")} <span>↻</span>
            </button>
            <button className="secondary-button" type="button" onClick={() => setScreen("lobby")}>
              {tx("TILL SPELRUMMET", "TO THE ROOM")}
            </button>
          </div>
          <p className="fine-print">
            {tx(
              "SPELA IGEN DRAR EN NY GÄRNINGSPERSON. BEVISEN FÖLJER DEN NATTEN.",
              "PLAY AGAIN DRAWS A NEW CULPRIT. THE CLUES FOLLOW THAT NIGHT.",
            )}
          </p>
        </section>
      )}

      {screen === "game" && !verdict && (
        <section className="content-page investigation">
          <p className="eyebrow">{tx("FALL 001 / PÅGÅENDE UTREDNING", "CASE 001 / INVESTIGATION UNDER WAY")}</p>
          <h1>{tx("DÖDEN PÅ BLACKWOOD MANOR", "DEATH AT BLACKWOOD MANOR")}</h1>
          <p className="muted">
            {tx(
              "Offret: Lord Alistair Blackwood · Tidpunkt: 22:15 · Plats: Biblioteket",
              "Victim: Lord Alistair Blackwood · Time: 10:15 · Place: The library",
            )}
          </p>

          <div className="case-banner">
            <div className="case-counts">
              <div>
                <span className="label">{tx("BIBLIOTEKET", "THE LIBRARY")}</span>
                <div className="big-number">
                  {CLUES.filter((clue) => seenClues.includes(clue.id)).length}
                  <span> / {CLUES.length}</span>
                </div>
              </div>
              <div>
                <span className="label">{tx("ÖVRIGA RUM", "OTHER ROOMS")}</span>
                <div className="big-number">
                  {HOUSE_FLAGS.filter((flag) => seenFlags.includes(flag)).length}
                  <span> / {HOUSE_FLAGS.length}</span>
                </div>
              </div>
            </div>
            <p>
              {tx(
                "Börja i biblioteket. Uret, brevet och glaset öppnar förhören. Första anblicken räcker sällan. Öppna, lyft och jämför sedan med vad de säger. Lösningen ligger redan i huset.",
                "Begin in the library. The clock, the letter, and the glass open the interviews. A first glance is rarely enough. Open, lift, and then compare with what they say. The solution is already in the house.",
              )}
            </p>
          </div>
          {error && <p className="error-message">{tr(error)}</p>}

          {selectedSuspect === null && (
            <div className="mode-switch" role="tablist">
              <button
                type="button"
                className={mode === "manor" ? "active" : ""}
                onClick={() => setMode("manor")}
              >
                {tx("HERRGÅRDEN", "THE MANOR")}
              </button>
              <button
                type="button"
                className={mode === "suspects" ? "active" : ""}
                disabled={!libraryReady}
                aria-describedby={libraryReady ? undefined : "interrogation-gate"}
                onClick={() => setMode("suspects")}
              >
                {tx("HÅLL FÖRHÖR", "HOLD AN INTERVIEW")}
              </button>
            </div>
          )}
          {selectedSuspect === null && !libraryReady && (
            <p id="interrogation-gate" className="muted gate-note">
              {tx("Biblioteket först.", "The library first.")} {libraryGate(libraryLeft)}
            </p>
          )}

          {selectedSuspect === null && mode === "manor" && (
            <ManorView
              examined={seenExamined}
              roomId={roomId}
              company={namesAt}
              onEnter={setRoomId}
              onLeave={() => setRoomId(null)}
              onExamine={examine}
            />
          )}

          {selectedSuspect === null && mode === "suspects" ? (
            <>
              <h2>{tx("DE MISSTÄNKTA", "THE SUSPECTS")}</h2>
              {suspectsHere.length > 0 && (
                <p className="room-company">
                  {tx(
                    `${suspectsHere.join(", ")} tittar på de misstänkta`,
                    `${suspectsHere.join(", ")} ${suspectsHere.length > 1 ? "are" : "is"} looking at the suspects`,
                  )}
                </p>
              )}
              <div className="suspect-grid">
                {SUSPECTS.map((suspect) => {
                  const lines = visibleTranscript.filter((entry) => entry.suspectId === suspect.id).length;
                  const talking = namesAt(`talk:${suspect.id}`);
                  const mood = suspectMood(suspect.id, inquiry);
                  return (
                    <button
                      key={suspect.id}
                      type="button"
                      className="suspect-card"
                      onClick={() => setSelectedSuspect(suspect.id)}
                    >
                      <div className="suspect-portrait">
                        <img src={suspect.image} alt="" />
                      </div>
                      <strong>{suspect.name}</strong>
                      <span>{tr(suspect.role)}</span>
                      <MoodLine mood={mood} />
                      <p className="suspect-detail">{tr(suspect.detail)}</p>
                      <span className="evidence-action">
                        {lines > 0
                          ? tx(`FORTSÄTT FÖRHÖR · ${lines}`, `CONTINUE INTERVIEW · ${lines}`)
                          : tx("HÅLL FÖRHÖR →", "HOLD AN INTERVIEW →")}
                      </span>
                      {talking.length > 0 && (
                        <span className="room-company">
                          {tx(
                            `${talking.join(", ")} förhör`,
                            `${talking.join(", ")} ${talking.length > 1 ? "are" : "is"} questioning`,
                          )}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {seenClues.length === 3 && (
                <div className="notice">
                  <strong>{tx("BIBLIOTEKETS TRE SPÅR ÄR INSAMLADE", "THE LIBRARY'S THREE CLUES ARE IN")}</strong>
                  <p>
                    {tx(
                      "Resten av huset kan fortfarande ändra vad de säger. Tonen ni väljer förändrar nästa mening.",
                      "The rest of the house can still change what they say. The tone you choose changes the next line.",
                    )}
                  </p>
                </div>
              )}
            </>
          ) : selectedSuspect !== null ? (
            <Interrogation
              suspectId={selectedSuspect}
              inquiry={inquiry}
              examined={seenExamined}
              transcript={visibleTranscript}
              onBack={() => setSelectedSuspect(null)}
              onSpeak={speak}
              onAsk={askFree}
            />
          ) : null}

          <div className="notebook">
            <h2>{tx("AKTEN", "THE CASE FILE")}</h2>
            {multiplayer && holding && (
              <div className="notice private-finds">
                <strong>{tx("BARA DU HAR SETT DET HÄR", "ONLY YOU HAVE SEEN THIS")}</strong>
                <p>
                  {tx(
                    "Fynd och förhör stannar hos dig tills du lägger dem i akten. Du kan redan använda dem själv.",
                    "Finds and interviews stay with you until you file them. You can already use them yourself.",
                  )}
                </p>
                <div className="notebook-list">
                  {privateClues.map((clue) => {
                    const face = cluePresentation(clue);
                    return (
                    <article key={clue.id} className="notebook-item">
                      <span className="label">{tx("BEVIS", "EVIDENCE")}</span>
                      <strong>{tr(face.name)}</strong>
                      <p>{tr(face.detail)}</p>
                    </article>
                    );
                  })}
                  {privateNotes.map((note) => (
                    <article key={note.flag} className="notebook-item">
                      <span className="label">{note.flag.startsWith("scene-") ? tx("HUSET", "THE HOUSE") : tx("FÖRHÖR", "INTERVIEW")}</span>
                      <strong>{tr(note.title)}</strong>
                      <p>{tr(note.text)}</p>
                    </article>
                  ))}
                  {ownLines.map((line) => (
                    <article key={line.id} className="notebook-item">
                      <span className="label">{tx("FÖRHÖR", "INTERVIEW")}</span>
                      <strong>{tr(line.prompt)}</strong>
                      <p>{localize(line.answer)}</p>
                    </article>
                  ))}
                </div>
                <button className="secondary-button" type="button" onClick={fileFinds}>
                  {tx("LÄGG I AKTEN", "FILE IT")}
                </button>
              </div>
            )}
            {clues.length === 0 && sharedNotes.length === 0 && transcript.length === 0 ? (
              <p className="muted">
                {heldBack.length > 0 || ownLines.length > 0
                  ? tx(
                      "Den gemensamma akten är tom tills någon lägger in ett fynd.",
                      "The shared file stays empty until someone files a find.",
                    )
                  : tx(
                      "Inget nedskrivet ännu. Undersök biblioteket eller ställ en fråga.",
                      "Nothing written down yet. Search the library or ask a question.",
                    )}
              </p>
            ) : (
              <>
                <div className="notebook-list">
                  {CLUES.filter((clue) => clues.includes(clue.id)).map((clue) => {
                    const face = cluePresentation(clue);
                    return (
                    <article key={clue.id} className="notebook-item">
                      <span className="label">{tx("BEVIS", "EVIDENCE")}</span>
                      <strong>{tr(face.name)}</strong>
                      <p>{tr(face.detail)}</p>
                    </article>
                    );
                  })}
                  {sharedNotes.map((note) => (
                    <article key={note.flag} className="notebook-item">
                      <span className="label">{note.flag.startsWith("scene-") ? tx("HUSET", "THE HOUSE") : tx("FÖRHÖR", "INTERVIEW")}</span>
                      <strong>{tr(note.title)}</strong>
                      <p>{tr(note.text)}</p>
                    </article>
                  ))}
                </div>
                {transcript.length > 0 && (
                  <div className="notebook-said">
                    {SUSPECTS.filter((suspect) => transcript.some((line) => line.suspectId === suspect.id)).map((suspect) => (
                      <article key={suspect.id} className="notebook-item">
                        <span className="label">{tx("VAD SOM SAGTS", "WHAT WAS SAID")}</span>
                        <strong>{suspect.name}</strong>
                        {transcript
                          .filter((line) => line.suspectId === suspect.id)
                          .map((line) => (
                            <div key={line.id} className="notebook-quote">
                              <p className="notebook-prompt">{tr(line.prompt)}</p>
                              <p>{localize(line.answer)}</p>
                            </div>
                          ))}
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <section className="evening">
            <h2>{tx("KVÄLLEN", "THE EVENING")}</h2>
            <p className="muted">
              {tx(
                "Klockslagen fylls när ett fynd eller ett svar säger något om tiden.",
                "The hours fill in when a find or an answer says something about the time.",
              )}
            </p>
            <div className="evening-row">
              {slots.map((slot) => (
                <article key={slot.id} className={slot.lines.length > 0 ? "evening-slot filled" : "evening-slot"}>
                  <span className="label">{slot.time}</span>
                  {slot.lines.length === 0 ? <p>—</p> : slot.lines.map((line) => <p key={line}>{line}</p>)}
                </article>
              ))}
            </div>
            {clashes.map((line) => (
              <p key={line} className="evening-clash">
                {line}
              </p>
            ))}
          </section>

          <div className="accuse-row">
            <div>
              <strong>{tx("LÄGG FRAM EN ANKLAGELSE", "PUT FORWARD AN ACCUSATION")}</strong>
              <p>
                {libraryReady
                  ? tx(
                      "En av er pekar ut någon och väljer ett skäl ur akten. De som är kvar röstar ja eller nej.",
                      "One of you points at someone and chooses a reason from the file. Those who remain vote yes or no.",
                    )
                  : `${tx("Biblioteket först.", "The library first.")} ${libraryGate(libraryLeft)}`}
              </p>
            </div>
            <button
              className="primary-button"
              type="button"
              disabled={accusation !== null || !libraryReady}
              onClick={() => {
                setPendingAccusation(null);
                setPendingReason(null);
                setAccuseOpen(true);
              }}
            >
              {tx("ANKLAGA", "ACCUSE")} <span>→</span>
            </button>
          </div>

          <button className="secondary-button back-button" type="button" onClick={() => setScreen("lobby")}>
            {tx("← TILLBAKA TILL SPELRUMMET", "← BACK TO THE ROOM")}
          </button>
        </section>
      )}

      {accuseOpen && (
        <div className="overlay" role="presentation" onClick={() => setAccuseOpen(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="accuse-title"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="eyebrow">{tx("SLUTPLÄDERING", "CLOSING ARGUMENT")}</p>
            <h2 id="accuse-title">{tx("Vem bär skulden?", "Who bears the guilt?")}</h2>
            <p className="muted">
              {multiplayer && seats.length > 1
                ? tx(
                    "Välj en person och ett skäl som redan ligger i akten. De som är kvar röstar ja eller nej.",
                    "Choose a person and a reason already in the file. Those who remain vote yes or no.",
                  )
                : tx(
                    "Välj en person och ett skäl ur akten. Domen låses för den här omgången.",
                    "Choose a person and a reason from the file. The verdict locks for this round.",
                  )}
            </p>
            <div className="accuse-list">
              {SUSPECTS.map((suspect) => (
                <button
                  key={suspect.id}
                  type="button"
                  className={`suspect-card ${pendingAccusation === suspect.id ? "selected" : ""}`}
                  onClick={() => setPendingAccusation(suspect.id)}
                >
                  <span className="accuse-person">
                    <img className="accuse-thumb" src={suspect.image} alt="" />
                    <span className="accuse-copy">
                      <strong>{suspect.name}</strong>
                      <span>{tr(suspect.role)}</span>
                    </span>
                  </span>
                </button>
              ))}
              <button
                type="button"
                className={`suspect-card ${pendingAccusation === "none" ? "selected" : ""}`}
                onClick={() => setPendingAccusation("none")}
              >
                <strong>{tx("Ingen anklagelse", "No accusation")}</strong>
                <span>{tx("Stäng akten utan att peka ut någon", "Close the file without pointing at anyone")}</span>
              </button>
            </div>
            <p className="label reason-heading">{tx("SKÄL UR AKTEN", "A REASON FROM THE FILE")}</p>
            {reasonChoices.length === 0 ? (
              <p className="muted">
                {tx(
                  "Akten är tom. Lägg in ett fynd eller ett förhör, och välj det som skäl.",
                  "The file is empty. File a find or an interview, and choose that as the reason.",
                )}
              </p>
            ) : (
              <div className="reason-list">
                {reasonChoices.map((reason) => (
                  <button
                    key={`${reason.title}-${reason.text}`}
                    type="button"
                    className={pendingReason?.title === reason.title && pendingReason.text === reason.text ? "selected" : ""}
                    onClick={() => setPendingReason(reason)}
                  >
                    <strong>{tr(reason.title)}</strong>
                    <span>{tr(reason.text)}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="ending-actions">
              <button
                className="primary-button"
                type="button"
                disabled={pendingAccusation === null || pendingReason === null}
                onClick={confirmAccusation}
              >
                {multiplayer && seats.length > 1 ? tx("LÄGG FRAM", "PUT FORWARD") : tx("FÄLL DOMEN", "PASS JUDGMENT")} <span>→</span>
              </button>
              <button className="secondary-button" type="button" onClick={() => setAccuseOpen(false)}>
                {tx("TILLBAKA", "BACK")}
              </button>
            </div>
          </div>
        </div>
      )}

      {accusation && !verdict && screen === "game" && (
        <AccusationVote
          accusation={accusation}
          seats={seats}
          places={places}
          myId={getPlayerId()}
          onVote={castVote}
          onWithdraw={withdrawAccusation}
          onLeave={() => setScreen("lobby")}
        />
      )}

      <footer className="footer">
        <span>MURDER ROOM © 2026</span>
        <span>{tx("VARJE SPÅR RÄKNAS.", "EVERY CLUE COUNTS.")}</span>
      </footer>
    </main>
  );
}

function MoodLine({ mood }: { mood: Mood | null }) {
  if (!mood) return null;
  const tone = mood === "öppen" ? "open" : mood === "tyst" ? "shut" : "wary";
  return <span className={`mood ${tone}`}>{tr(mood.toUpperCase())}</span>;
}

function AccusationVote({
  accusation,
  seats,
  places,
  myId,
  onVote,
  onWithdraw,
  onLeave,
}: {
  accusation: Accusation;
  seats: Seat[];
  places: Place[];
  myId: string;
  onVote: (yes: boolean) => void;
  onWithdraw: () => void;
  onLeave: () => void;
}) {
  const proposer = seats.find((seat) => seat.id === accusation.proposerId);
  const voters = seatedOthers(seats, places, accusation.proposerId);
  const mine = accusation.votes.find((vote) => vote.playerId === myId);
  const yes = accusation.votes.filter((vote) => vote.yes).length;
  const no = accusation.votes.length - yes;
  const waiting = Math.max(voters.length - accusation.votes.length, 0);
  const named = accusedLabel(accusation.target);
  const iAmProposer = myId === accusation.proposerId;

  return (
    <div className="overlay" role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="vote-title">
        <p className="eyebrow">
          {accusation.round > 1
            ? tx(`OMRÖSTNING · OMGÅNG ${accusation.round}`, `VOTE · ROUND ${accusation.round}`)
            : tx("OMRÖSTNING", "VOTE")}
        </p>
        <h2 id="vote-title">{named === "ingen" ? tx("Ingen anklagelse", "No accusation") : named}</h2>
        {accusation.reason && (
          <div className="vote-reason">
            <span className="label">{tx("SKÄL", "REASON")}</span>
            <strong>{tr(accusation.reason.title)}</strong>
            <p>{tr(accusation.reason.text)}</p>
          </div>
        )}
        <p className="muted">
          {tx(
            `${iAmProposer ? "Du" : proposer?.name || "En utredare"} har lagt fram anklagelsen. De som är kvar i utredningen röstar ja eller nej. Oavgjort eller fler ja fäller den.`,
            `${iAmProposer ? "You" : proposer?.name || "An investigator"} put the accusation forward. Those still in the investigation vote yes or no. A tie, or more yes votes, carries it.`,
          )}
        </p>
        {accusation.round > 1 && (
          <p className="muted">
            {tx("Förra omgången fick fler nej. Rösta igen om samma person.", "The last round had more no votes. Vote again on the same person.")}
          </p>
        )}
        <p className="vote-tally">
          {tx(`Ja ${yes} · Nej ${no}`, `Yes ${yes} · No ${no}`)}
          {waiting > 0 ? tx(` · ${waiting} har inte röstat`, ` · ${waiting} have not voted`) : ""}
        </p>
        {iAmProposer ? (
          <div className="ending-actions">
            <p className="muted">
              {tx("Du har redan lagt fram anklagelsen och röstar inte.", "You have already put the accusation forward and do not vote.")}
            </p>
            <button className="secondary-button" type="button" onClick={onWithdraw}>
              {tx("TA TILLBAKA", "WITHDRAW")}
            </button>
            <button className="secondary-button" type="button" onClick={onLeave}>
              {tx("TILL SPELRUMMET", "TO THE ROOM")}
            </button>
          </div>
        ) : mine ? (
          <div className="ending-actions">
            <p className="muted">
              {tx(
                `Du röstade ${mine.yes ? "ja" : "nej"}. Väntar på de som är kvar.`,
                `You voted ${mine.yes ? "yes" : "no"}. Waiting for those who remain.`,
              )}
            </p>
            <button className="secondary-button" type="button" onClick={onLeave}>
              {tx("TILL SPELRUMMET", "TO THE ROOM")}
            </button>
          </div>
        ) : (
          <div className="ending-actions">
            <button className="primary-button" type="button" onClick={() => onVote(true)}>
              {tx("JA", "YES")} <span>✓</span>
            </button>
            <button className="secondary-button" type="button" onClick={() => onVote(false)}>
              {tx("NEJ", "NO")}
            </button>
            <button className="secondary-button" type="button" onClick={onLeave}>
              {tx("TILL SPELRUMMET", "TO THE ROOM")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function libraryGate(missing: { id: ClueId }[]) {
  const word = (id: ClueId) =>
    tx(id === "clock" ? "uret" : id === "letter" ? "brevet" : "glaset", id === "clock" ? "the clock" : id === "letter" ? "the letter" : "the glass");
  const names = missing.map((clue, index) => {
    const label = word(clue.id);
    return index === 0 ? label.charAt(0).toUpperCase() + label.slice(1) : label;
  });
  if (names.length <= 1) return tx(`${names[0] ?? "Biblioteket"} återstår.`, `${names[0] ?? "The library"} still remains.`);
  if (names.length === 2) return tx(`${names[0]} och ${names[1]} återstår.`, `${names[0]} and ${names[1]} still remain.`);
  return tx(`${names[0]}, ${names[1]} och ${names[2]} återstår.`, `${names[0]}, ${names[1]} and ${names[2]} still remain.`);
}

function nextQuestionLine(rooms: string[]) {
  const names = rooms.map((room) => tr(room));
  if (rooms.length === 0) {
    return tx(
      "Inga fler sådana frågor öppnar sig just nu. Något en annan sagt kan ge en ny mening.",
      "No further questions of that kind open right now. Something someone else said can give a new line.",
    );
  }
  if (rooms.length === 1) {
    return tx(
      `Nästa mening väntar i ${rooms[0]}. Ett fynd där öppnar den.`,
      `The next line is waiting in ${names[0]}. A find there opens it.`,
    );
  }
  const last = rooms[rooms.length - 1];
  const lastEn = names[names.length - 1];
  return tx(
    `Nästa mening väntar i ${rooms.slice(0, -1).join(", ")} eller ${last}. Ett fynd där öppnar den.`,
    `The next line is waiting in ${names.slice(0, -1).join(", ")} or ${lastEn}. A find there opens it.`,
  );
}

function Interrogation({
  suspectId,
  inquiry,
  examined,
  transcript,
  onBack,
  onSpeak,
  onAsk,
}: {
  suspectId: SuspectId;
  inquiry: InquiryState;
  examined: string[];
  transcript: TranscriptEntry[];
  onBack: () => void;
  onSpeak: (choice: Choice) => void;
  onAsk: (question: string) => Promise<void>;
}) {
  const suspect = SUSPECTS.find((item) => item.id === suspectId);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  if (!suspect) return null;
  const lines = transcript.filter((entry) => entry.suspectId === suspectId);
  const choices = availableChoices(suspectId, inquiry);
  const nextRooms = roomsThatOpenQuestions(suspectId, inquiry, examined);

  async function submit(event: { preventDefault: () => void }) {
    event.preventDefault();
    const trimmed = question.trim();
    if (trimmed.length < 2 || asking) return;
    setAsking(true);
    try {
      await onAsk(trimmed);
      setQuestion("");
    } catch {
      // Appen visar felet. Utkastet får stå kvar.
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="interrogate">
      <button className="secondary-button back-button" type="button" onClick={onBack}>
        ← {tx("TILLBAKA", "BACK")}
      </button>
      <div className="interrogate-head">
        <div className="suspect-portrait">
          <img src={suspect.image} alt="" />
        </div>
        <div>
          <h2>{suspect.name}</h2>
          <p className="muted">{tr(suspect.role)}</p>
          <MoodLine mood={suspectMood(suspectId, inquiry)} />
          <p className="suspect-detail">{tr(suspect.detail)}</p>
        </div>
      </div>

      <div className="transcript" aria-live="polite">
        {lines.length === 0 ? (
          <p className="muted">{tx("Personen väntar. Den första frågan sätter tonen.", "The person is waiting. The first question sets the tone.")}</p>
        ) : (
          lines.map((line) => (
            <article key={line.id} className="exchange">
              <p className="bubble-you">{tr(line.prompt)}</p>
              <p className="bubble-them">{localize(line.answer)}</p>
            </article>
          ))
        )}
      </div>

      <h2>{tx("FRÅGOR SOM FÖR FALLET FRAMÅT", "QUESTIONS THAT MOVE THE CASE")}</h2>
      <p className="muted">
        {tx("De här meningarna öppnar nästa svar och kan ändra slutet.", "These lines open the next answer and can change the ending.")}
      </p>
      {choices.length === 0 ? (
        <p className="muted">{nextQuestionLine(nextRooms)}</p>
      ) : (
        <div className="choice-list">
          {choices.map((choice) => (
            <button key={choice.id} className="choice-button" type="button" onClick={() => onSpeak(choice)}>
              <span className="choice-tag">{tr(choice.tag)}</span>
              {tr(choice.label)}
              {choice.outcome && (
                <span className={`choice-outcome ${choice.outcome}`}>
                  {choice.outcome === "open"
                    ? tx("Öppnar nästa svar.", "Opens the next answer.")
                    : tx("Stänger personen.", "Shuts the person.")}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <form className="ask-form" onSubmit={(event) => void submit(event)}>
        <label htmlFor="free-question">{tx("TRYCK PÅ DET SOM REDAN SAGTS", "PRESS ON WHAT HAS ALREADY BEEN SAID")}</label>
        <p className="muted ask-note">
          {tx(
            "Egna ord låser inte upp nya spår. Använd dem för att höra personen säga något en gång till.",
            "Your own words do not unlock new leads. Use them to hear the person say something once more.",
          )}
        </p>
        <div className="ask-row">
          <input
            id="free-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={tx("Fråga om något personen redan har sagt", "Ask about something the person has already said")}
            maxLength={280}
            autoComplete="off"
          />
          <button className="secondary-button" type="submit" disabled={asking || question.trim().length < 2}>
            {asking ? tx("VÄNTAR", "WAITING") : tx("FRÅGA", "ASK")}
          </button>
        </div>
        {asking && <p className="muted ask-note">{tx("Personen dröjer med svaret.", "The person is slow with the answer.")}</p>}
      </form>
    </div>
  );
}

export default App;
