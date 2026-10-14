import { addTranslations, tr } from "./locale";
import { getCulprit, type CulpritId } from "./solution";
import type { Choice, InquiryState, SuspectId, TimelineSlot, Verdict, VerdictTarget } from "./mystery";

type NightId = Exclude<CulpritId, "thomas">;

function pair(swedish: string, english: string) {
  addTranslations({ [swedish]: english });
  return swedish;
}

function who(name: string) {
  const trimmed = name.trim();
  if (!trimmed || trimmed.toLowerCase() === "du") return "utredare";
  return trimmed;
}

function fill(name: string, template: string) {
  return template.replaceAll("{n}", who(name));
}

function has(state: InquiryState, flag: string) {
  return state.flags.includes(flag);
}

function fresh(state: InquiryState, id: string) {
  return !state.used.includes(id);
}

function clue(state: InquiryState, id: string) {
  return state.clues.includes(id as "clock");
}

function allClues(state: InquiryState) {
  return clue(state, "clock") && clue(state, "letter") && clue(state, "glass");
}

function beat(
  id: string,
  suspectId: SuspectId,
  tag: string,
  label: [string, string],
  when: (state: InquiryState) => boolean,
  grants: string[],
  answer: [string, string],
  outcome?: "open" | "shut",
): Choice {
  const labelText = pair(label[0], label[1]);
  const answerText = pair(answer[0], answer[1]);
  return {
    id,
    suspectId,
    tag,
    outcome,
    label: labelText,
    available: (state) => fresh(state, id) && when(state),
    resolve: (_state, name) => ({ answer: fill(name, answerText), grants }),
  };
}

const victoriaLetter = pair(
  "Sigillet spricker. Texten är kort: ”Edward — skriv inte över huset till henne. Jag gör det inte i kväll. Victoria får inte veta att jag läst utkastet.”",
  "The seal cracks. The text is short: “Edward — do not sign the house over to her. I will not do it tonight. Victoria must not know I have read the draft.”",
);
const edwardLetter = pair(
  "Sigillet spricker. Texten är kort: ”Edward — jag har ditt utkast. Du har tagit arvode ur boet sedan mars. Vi gör slut på det i kväll.”",
  "The seal cracks. The text is short: “Edward — I have your draft. You have been taking fees from the estate since March. We end it tonight.”",
);
const claraLetter = pair(
  "Sigillet spricker. Texten är kort: ”Edward — Clara lämnar tjänsten i morgon. Hon får inte nyckeln till källaren igen. Skriv uppsägningen.”",
  "The seal cracks. The text is short: “Edward — Clara leaves service tomorrow. She is not to have the cellar key again. Write the dismissal.”",
);
const victoriaPrints = pair(
  "De går till bänken och vänder tillbaka mot dörren. Någon gick in igen.",
  "They go to the bench and turn back toward the door. Someone went inside again.",
);
const victoriaDrawer = pair(
  "Under kuvertet ligger ett utkast. Alistair behåller huset i sitt namn och ger Victoria ett underhåll, inte herrgården. Bläcket är hans.",
  "Under the envelope lies a draft. Alistair keeps the house in his own name and gives Victoria an allowance, not the manor. The ink is his.",
);
const edwardDrawer = pair(
  "Under kuvertet ligger ett utkast i Edwards handstil. Alistair har inte signerat det. Raderna flyttar kapitalet till Edward själv.",
  "Under the envelope lies a draft in Edward's hand. Alistair has not signed it. The lines move the capital to Edward himself.",
);
const edwardTicket = pair(
  "Inuti ligger en biljett. Sista tåget mot London, i kväll. Resten av väskan är nästan tom.",
  "Inside lies a ticket. The last train to London, tonight. The rest of the bag is almost empty.",
);
const claraDrawer = pair(
  "Lådan är nästan tom. Ett tjänstebrev till Clara ligger vikt, utan datum och utan underskrift.",
  "The drawer is almost empty. A service letter to Clara lies folded, without a date and without a signature.",
);
const claraShawl = pair(
  "En sjal ligger hopvikt mot stenen. Tyget är lätt varmt. Fönstret står på glänt, och skrivbordet syns klart härifrån.",
  "A shawl lies folded against the stone. The cloth is faintly warm. The window is ajar, and the desk is clearly visible from here.",
);

const STAGES: Record<NightId, Record<string, string>> = {
  victoria: {
    "desk-letter": victoriaLetter,
    "gravel-follow": victoriaPrints,
    "drawer-open": victoriaDrawer,
  },
  edward: {
    "desk-letter": edwardLetter,
    "drawer-open": edwardDrawer,
    "bag-open": edwardTicket,
  },
  clara: {
    "desk-letter": claraLetter,
    "drawer-open": claraDrawer,
    "bench-shawl": claraShawl,
  },
};

const LETTERS: Record<NightId, string> = {
  victoria: victoriaLetter,
  edward: edwardLetter,
  clara: claraLetter,
};

export function stageCopy(stageId: string, fallback: string) {
  const culprit = getCulprit();
  if (culprit === "thomas") return fallback;
  return STAGES[culprit][stageId] ?? fallback;
}

export function clueDetail(id: string, fallback: string) {
  const culprit = getCulprit();
  if (culprit === "thomas" || id !== "letter") return fallback;
  return LETTERS[culprit];
}

const victoriaReturned = pair(
  "Gruset ljuger inte, {n}. Jag gick tillbaka. Jag skulle säga att huset var mitt. Han satt redan vid glaset. Jag säger inte att jag rörde det.",
  "The gravel does not lie, {n}. I went back. I was going to say the house was mine. He was already at the glass. I am not saying I touched it.",
);
const victoriaDenied = pair(
  "De är mina, {n}. De slutar vid bänken. Jag gick inte in igen, och jag tänker inte låta dig rita en dörr där det inte finns någon.",
  "They are mine, {n}. They end at the bench. I did not go back in, and I will not let you draw a door where there is none.",
);

const VICTORIA: Choice[] = [
  beat(
    "nv-v-where",
    "victoria",
    "ÖPPNING",
    ["Var befann du dig när din bror dog?", "Where were you when your brother died?"],
    () => true,
    ["v-alibi", "nv-out"],
    ["På terrassen, {n}. Vi hade grälat, och jag behövde luft. När skriket kom stod jag redan där.", "On the terrace, {n}. We had quarrelled, and I needed air. When the scream came I was already there."],
  ),
  beat(
    "nv-v-will",
    "victoria",
    "FÖLJ FRÅGAN",
    ["Vad handlade grälet om?", "What was the quarrel about?"],
    (state) => has(state, "v-alibi"),
    ["v-will"],
    [
      "Huset. Han ville skriva det till någon annan, som om namnet Blackwood bara var hans. Jag gick innan jag sa något jag inte kunde ta tillbaka.",
      "The house. He wanted to sign it away to someone else, as if the name Blackwood were only his. I left before I said something I could not take back.",
    ],
  ),
  beat(
    "nv-v-gentle",
    "victoria",
    "LUGN TON",
    ["Brevet säger att han inte tänkte ge dig huset. Jag tror ändå inte att du dödade honom.", "The letter says he was not going to give you the house. I still do not think you killed him."],
    (state) => has(state, "v-will") && clue(state, "letter") && !has(state, "v-tone") && !has(state, "v-hostile"),
    ["v-tone", "nv-knew-letter"],
    [
      "Då har du läst det han inte ville att jag skulle se, {n}. Jag blev rasande. Jag gick ut. Jag gick inte in igen.",
      "Then you have read what he did not want me to see, {n}. I was furious. I went out. I did not go back in.",
    ],
    "open",
  ),
  {
    id: "nv-v-prints",
    suspectId: "victoria",
    tag: "TERRASSEN",
    label: pair("Spåren vänder tillbaka mot dörren.", "The prints turn back toward the door."),
    available: (state) => fresh(state, "nv-v-prints") && has(state, "v-will") && has(state, "scene-terrace-prints") && !has(state, "v-hostile"),
    resolve: (state, name) =>
      has(state, "v-tone")
        ? { answer: fill(name, victoriaReturned), grants: ["nv-returned"] }
        : { answer: fill(name, victoriaDenied), grants: ["nv-denied"] },
  },
  beat(
    "nv-v-accuse",
    "victoria",
    "ANKLAGA",
    ["Du gick tillbaka och dödade honom.", "You went back and killed him."],
    (state) => has(state, "v-alibi") && !has(state, "nv-confessed"),
    ["v-hostile"],
    ["Du fäller mig för ett gräl, {n}. Jag har inget mer att säga.", "You condemn me for a quarrel, {n}. I have nothing more to say."],
    "shut",
  ),
  beat(
    "nv-v-chain",
    "victoria",
    "HELA KEDJAN",
    [
      "Clara såg dig komma tillbaka. Spåren vänder. Brevet är ditt motiv. Glaset var hans.",
      "Clara saw you come back. The prints turn. The letter is your motive. The glass was his.",
    ],
    (state) => has(state, "nv-returned") && has(state, "c-saw-v") && allClues(state) && !has(state, "v-hostile"),
    ["nv-confessed"],
    [
      "Hon såg mig, {n}. Jag gick in. Han vände sig inte om. Jag lade det i glaset medan han läste, och jag slog sönder uret så att det skulle se ut som om jag redan var ute. Huset skulle ha gått ifrån mig.",
      "She saw me, {n}. I went in. He did not turn around. I put it in the glass while he was reading, and I smashed the clock so it would look as if I were already outside. The house was going to be taken from me.",
    ],
  ),
  beat(
    "nv-c-last",
    "clara",
    "ÖPPNING",
    ["När såg du honom sist?", "When did you last see him?"],
    () => true,
    ["c-last"],
    ["Kvart i tio, {n}. Han skrev. Jag lämnade karaffen och gick.", "Quarter to ten, {n}. He was writing. I left the decanter and went."],
  ),
  beat(
    "nv-c-who",
    "clara",
    "FÖLJ FRÅGAN",
    ["Vem såg du i dörren?", "Whom did you see in the doorway?"],
    (state) => has(state, "c-last"),
    ["c-saw-v"],
    [
      "Victoria, {n}. Hon kom in från terrassen när jag gick ut. Han satt kvar vid skrivbordet.",
      "Victoria, {n}. She came in from the terrace as I went out. He was still at the desk.",
    ],
  ),
  beat(
    "nv-c-clock",
    "clara",
    "BEVIS · URET",
    ["Uret är slaget till 22:15.", "The clock is smashed to 10:15."],
    (state) => has(state, "c-last") && clue(state, "clock"),
    ["c-clock-intact"],
    [
      "Jag drog upp det klockan nio. Glaset var helt. Någon har ställt om det efteråt.",
      "I wound it at nine. The glass was intact. Someone set it afterwards.",
    ],
  ),
  beat(
    "nv-c-trust",
    "clara",
    "LUGN TON",
    ["Jag tror dig. Berätta om vinet.", "I believe you. Tell me about the wine."],
    (state) => has(state, "c-saw-v") && !has(state, "c-tone") && !has(state, "c-offended"),
    ["c-tone", "c-wine-fresh"],
    [
      "Karaffen var ny, {n}. Jag korkade upp den själv. Det som hände i glaset hände efter att jag gått.",
      "The decanter was new, {n}. I drew the cork myself. Whatever happened in the glass happened after I left.",
    ],
    "open",
  ),
  beat(
    "nv-e-where",
    "edward",
    "ÖPPNING",
    ["Var var du när skriket kom?", "Where were you when the scream came?"],
    () => true,
    ["e-alibi"],
    ["På mitt rum, {n}. Med papperen. Jag hörde det därifrån.", "In my room, {n}. With the papers. I heard it from there."],
  ),
  beat(
    "nv-e-drawer",
    "edward",
    "EDWARDS RUM",
    ["Kodicillen låg i din låda. Vem var du rädd för?", "The codicil was in your drawer. Whom were you afraid of?"],
    (state) => has(state, "e-alibi") && has(state, "scene-codicil") && clue(state, "letter"),
    ["e-tone", "nv-edward-hid"],
    [
      "För henne, {n}. Victoria. Han tänkte neka henne huset. Jag lade undan utkastet. Jag gick inte till biblioteket. Rädsla är inte gift.",
      "Of her, {n}. Victoria. He meant to refuse her the house. I put the draft away. I did not go to the library. Fear is not poison.",
    ],
    "open",
  ),
  beat(
    "nv-t-where",
    "thomas",
    "ÖPPNING",
    ["Var befann du dig från klockan tio?", "Where were you from ten o'clock?"],
    () => true,
    ["t-alibi"],
    [
      "I arbetsrummet, {n}. Lampan, böckerna, jag. Jag rörde inte biblioteket.",
      "In the study, {n}. The lamp, the books, myself. I did not touch the library.",
    ],
  ),
  beat(
    "nv-t-lamp",
    "thomas",
    "ARBETSRUMMET",
    ["Lampan är kall.", "The lamp is cold."],
    (state) => has(state, "t-alibi") && has(state, "scene-study-cold"),
    ["t-wary", "nv-reed-slipped"],
    [
      "Kall, ja. Jag släckte och gick ut i korridoren en stund. Det gör mig inte till den som slog sönder uret.",
      "Cold, yes. I put it out and stepped into the corridor for a while. That does not make me the one who smashed the clock.",
    ],
  ),
  beat(
    "nv-t-letter",
    "thomas",
    "BEVIS · BREVET",
    ["Brevet handlar om huset, inte om dig.", "The letter is about the house, not about you."],
    (state) => has(state, "t-alibi") && clue(state, "letter"),
    ["nv-reed-clear"],
    [
      "Då vet du att det här inte var mina pengar, {n}. Victoria ville ha herrgården. Jag ville ha en tyst kväll.",
      "Then you know this was not my money, {n}. Victoria wanted the manor. I wanted a quiet evening.",
    ],
  ),
];

const edwardAdmitted = pair(
  "Han hade mitt utkast, {n}. Om han visade det för Victoria var jag färdig i huset. Jag gick dit för att ta tillbaka papperet. Jag säger inte mer än så.",
  "He had my draft, {n}. If he showed it to Victoria I was finished in that house. I went there to take the paper back. I will not say more than that.",
);
const edwardDeniedPaper = pair(
  "Ett utkast är inte ett brott, {n}. Han skulle aldrig ha signerat det. Jag stannade på mitt rum.",
  "A draft is not a crime, {n}. He would never have signed it. I stayed in my room.",
);

const EDWARD: Choice[] = [
  beat(
    "ne-v-where",
    "victoria",
    "ÖPPNING",
    ["Var befann du dig när din bror dog?", "Where were you when your brother died?"],
    () => true,
    ["v-alibi"],
    [
      "På bänken, {n}. Jag gick ut efter middagen och stannade där. Om ni hittar spår slutar de vid stenen.",
      "On the bench, {n}. I went out after dinner and stayed there. If you find prints, they end at the stone.",
    ],
  ),
  beat(
    "ne-v-prints",
    "victoria",
    "TERRASSEN",
    ["Spåren slutar vid bänken.", "The prints end at the bench."],
    (state) => has(state, "v-alibi") && has(state, "scene-terrace-prints"),
    ["v-tone", "ne-victoria-out"],
    [
      "De är mina, {n}. De vänder inte tillbaka. Jag såg fönstret. Jag såg inte rummet.",
      "They are mine, {n}. They do not turn back. I saw the window. I did not see the room.",
    ],
    "open",
  ),
  beat(
    "ne-v-will",
    "victoria",
    "FÖLJ FRÅGAN",
    ["Vad grälade ni om?", "What did you quarrel about?"],
    (state) => has(state, "v-alibi"),
    ["v-will"],
    [
      "Han sa att Edward hade rört arvet. Jag blev arg för att han lät en advokat sitta så nära huset. Sedan gick jag ut.",
      "He said Edward had touched the inheritance. I was angry that he let a lawyer sit so close to the house. Then I went out.",
    ],
  ),
  beat(
    "ne-e-where",
    "edward",
    "ÖPPNING",
    ["Var var du när skriket kom?", "Where were you when the scream came?"],
    () => true,
    ["e-alibi"],
    ["På mitt rum, {n}. Med papper. Jag lämnade det inte.", "In my room, {n}. With papers. I did not leave it."],
  ),
  beat(
    "ne-e-letter",
    "edward",
    "BEVIS · BREVET",
    ["Brevet säger att du tagit arvode ur boet.", "The letter says you have been taking fees from the estate."],
    (state) => has(state, "e-alibi") && clue(state, "letter"),
    ["ne-denied"],
    [
      "Det där är hans vrede, {n}. Arvodet var avtalat. Ett brev är inte en dom.",
      "That is his anger, {n}. The fee was agreed. A letter is not a verdict.",
    ],
  ),
  {
    id: "ne-e-drawer",
    suspectId: "edward",
    tag: "EDWARDS RUM",
    label: pair("Utkastet i lådan är skrivet av dig.", "The draft in the drawer is written by you."),
    available: (state) => fresh(state, "ne-e-drawer") && has(state, "e-alibi") && has(state, "scene-codicil") && !has(state, "e-defensive"),
    resolve: (state, name) =>
      has(state, "ne-denied") || clue(state, "letter")
        ? { answer: fill(name, edwardAdmitted), grants: ["e-tone", "ne-forge", "ne-admitted"] }
        : { answer: fill(name, edwardDeniedPaper), grants: ["ne-forge"] },
  },
  beat(
    "ne-e-ticket",
    "edward",
    "EDWARDS RUM",
    ["Biljetten gäller sista tåget i kväll.", "The ticket is for the last train tonight."],
    (state) => has(state, "e-alibi") && has(state, "scene-edward-ticket"),
    ["ne-train"],
    [
      "Jag tänkte åka om han skrev under, {n}. Jag åkte inte. En biljett är en utväg, inte ett mord.",
      "I meant to leave if he signed, {n}. I did not leave. A ticket is a way out, not a murder.",
    ],
  ),
  beat(
    "ne-e-accuse",
    "edward",
    "ANKLAGA",
    ["Du dödade honom för att han skulle avslöja utkastet.", "You killed him because he was going to expose the draft."],
    (state) => has(state, "e-alibi") && !has(state, "ne-confessed"),
    ["e-defensive"],
    ["Då är samtalet slut, {n}. Anklaga en advokat med ett papper och se hur långt det bär.", "Then the conversation is over, {n}. Accuse a lawyer with a paper and see how far it carries."],
    "shut",
  ),
  beat(
    "ne-e-chain",
    "edward",
    "HELA KEDJAN",
    [
      "Clara såg dig gå in. Utkastet är ditt. Biljetten är i kväll. Glaset är hans.",
      "Clara saw you go in. The draft is yours. The ticket is for tonight. The glass was his.",
    ],
    (state) => has(state, "c-saw-e") && has(state, "ne-forge") && has(state, "ne-train") && allClues(state) && !has(state, "e-defensive"),
    ["ne-confessed"],
    [
      "Hon såg mig, {n}. Jag lade det i glaset medan han läste utkastet, slog sönder uret och ställde visarna på kvart över tio. Tåget skulle ha tagit mig innan någon jämförde handstilen.",
      "She saw me, {n}. I put it in the glass while he read the draft, smashed the clock and set the hands to quarter past ten. The train would have taken me before anyone compared the handwriting.",
    ],
  ),
  beat(
    "ne-c-last",
    "clara",
    "ÖPPNING",
    ["När såg du honom sist?", "When did you last see him?"],
    () => true,
    ["c-last"],
    ["Kvart i tio, {n}. Han skrev. Jag ställde ner karaffen och gick.", "Quarter to ten, {n}. He was writing. I set down the decanter and left."],
  ),
  beat(
    "ne-c-who",
    "clara",
    "FÖLJ FRÅGAN",
    ["Vem kom in när du gick?", "Who came in as you left?"],
    (state) => has(state, "c-last"),
    ["c-saw-e"],
    [
      "Edward, {n}. Han kom in när jag gick ut. Alistair satt kvar med pennan.",
      "Edward, {n}. He came in as I went out. Alistair was still holding the pen.",
    ],
  ),
  beat(
    "ne-c-clock",
    "clara",
    "BEVIS · URET",
    ["Uret är slaget till 22:15.", "The clock is smashed to 10:15."],
    (state) => has(state, "c-last") && clue(state, "clock"),
    ["c-clock-intact"],
    ["Jag drog upp det klockan nio. Glaset var helt. Någon ställde om det sedan.", "I wound it at nine. The glass was intact. Someone set it later."],
  ),
  beat(
    "ne-c-trust",
    "clara",
    "LUGN TON",
    ["Jag tror dig. Var vinet orört när du gick?", "I believe you. Was the wine untouched when you left?"],
    (state) => has(state, "c-saw-e") && !has(state, "c-tone") && !has(state, "c-offended"),
    ["c-tone", "c-wine-fresh"],
    [
      "Karaffen var ny, {n}. Jag korkade upp den själv. Bara den som blev kvar kunde röra glaset.",
      "The decanter was new, {n}. I drew the cork myself. Only the person who stayed could have touched the glass.",
    ],
    "open",
  ),
  beat(
    "ne-t-where",
    "thomas",
    "ÖPPNING",
    ["Var befann du dig från klockan tio?", "Where were you from ten o'clock?"],
    () => true,
    ["t-alibi"],
    ["I arbetsrummet, {n}. Jag rörde inte biblioteket.", "In the study, {n}. I did not touch the library."],
  ),
  beat(
    "ne-t-lamp",
    "thomas",
    "ARBETSRUMMET",
    ["Lampan är kall.", "The lamp is cold."],
    (state) => has(state, "t-alibi") && has(state, "scene-study-cold"),
    ["t-wary", "ne-reed-slipped"],
    [
      "Jag släckte, {n}. Jag gick en sväng i korridoren. Det är en dålig vana, inte ett motiv.",
      "I put it out, {n}. I walked the corridor. That is a bad habit, not a motive.",
    ],
  ),
  beat(
    "ne-t-letter",
    "thomas",
    "BEVIS · BREVET",
    ["Brevet namnger Edward, inte dig.", "The letter names Edward, not you."],
    (state) => has(state, "t-alibi") && clue(state, "letter"),
    ["ne-reed-clear"],
    ["Då kan du sluta se på mig som om siffrorna vore mina, {n}.", "Then you can stop looking at me as if the figures were mine, {n}."],
  ),
];

const claraPoured = pair(
  "Jag korkade upp den i kväll, {n}. Jag gick tillbaka med den. Han levde när jag ställde ner den. Mer än så ger jag inte bort.",
  "I drew the cork tonight, {n}. I went back with it. He was alive when I set it down. I will not give you more than that.",
);
const claraEarly = pair(
  "Jag skar korken före middagen, {n}. Karaffen stod hos honom när jag gick. Dra inga linjer mellan ett kök och ett glas.",
  "I cut the cork before dinner, {n}. The decanter was with him when I left. Draw no line between a kitchen and a glass.",
);

const CLARA: Choice[] = [
  beat(
    "nc-v-where",
    "victoria",
    "ÖPPNING",
    ["Var befann du dig när din bror dog?", "Where were you when your brother died?"],
    () => true,
    ["v-alibi"],
    [
      "På terrassen, {n}. Det var varmt inne. Jag satt på bänken tills jag hörde skriket.",
      "On the terrace, {n}. It was warm indoors. I sat on the bench until I heard the scream.",
    ],
  ),
  beat(
    "nc-v-window",
    "victoria",
    "TERRASSEN",
    ["Från bänken ser man skrivbordet. Vem såg du?", "From the bench you can see the desk. Whom did you see?"],
    (state) => has(state, "v-alibi") && has(state, "scene-shawl"),
    ["v-tone", "v-saw-clara"],
    [
      "Clara, {n}. Hon skulle ha gått. Hon stod kvar vid skrivbordet när klockan i hallen slog tio.",
      "Clara, {n}. She should have gone. She was still at the desk when the clock in the hall struck ten.",
    ],
    "open",
  ),
  beat(
    "nc-v-prints",
    "victoria",
    "TERRASSEN",
    ["Spåren slutar vid bänken.", "The prints end at the bench."],
    (state) => has(state, "v-alibi") && has(state, "scene-terrace-prints"),
    ["ne-victoria-out"],
    ["De är mina, {n}. Jag gick inte in. Jag behövde inte gå in för att se skrivbordet.", "They are mine, {n}. I did not go in. I did not need to go in to see the desk."],
  ),
  beat(
    "nc-e-where",
    "edward",
    "ÖPPNING",
    ["Var var du när skriket kom?", "Where were you when the scream came?"],
    () => true,
    ["e-alibi"],
    ["På mitt rum, {n}. Jag hörde det genom dörren.", "In my room, {n}. I heard it through the door."],
  ),
  beat(
    "nc-e-letter",
    "edward",
    "BEVIS · BREVET",
    ["Brevet säger att Clara ska lämna tjänsten.", "The letter says Clara is to leave service."],
    (state) => has(state, "e-alibi") && clue(state, "letter"),
    ["e-tone", "nc-edward-knew"],
    [
      "Han bad mig skriva uppsägningen, {n}. Hon hade tagit ur källarkontot. Jag skrev den inte. Jag var rädd för att hon skulle se brevet.",
      "He asked me to write the dismissal, {n}. She had been taking from the cellar account. I did not write it. I was afraid she would see the letter.",
    ],
    "open",
  ),
  beat(
    "nc-e-drawer",
    "edward",
    "EDWARDS RUM",
    ["I lådan ligger ett osignerat tjänstebrev till henne.", "In the drawer lies an unsigned service letter to her."],
    (state) => has(state, "nc-edward-knew") && has(state, "scene-codicil"),
    ["nc-drawer-seen"],
    [
      "Det är utkastet jag inte vågade skriva rent, {n}. Hon hade nyckeln. Hon visste att han tänkte ta den.",
      "It is the draft I did not dare to write out, {n}. She had the key. She knew he meant to take it.",
    ],
  ),
  beat(
    "nc-c-last",
    "clara",
    "ÖPPNING",
    ["När lämnade du biblioteket?", "When did you leave the library?"],
    () => true,
    ["c-last", "nc-claimed-left"],
    [
      "Kvart i tio, {n}. Han skrev. Karaffen stod redan där. Jag gick till köket.",
      "Quarter to ten, {n}. He was writing. The decanter was already there. I went to the kitchen.",
    ],
  ),
  {
    id: "nc-c-cork",
    suspectId: "clara",
    tag: "KÖKET",
    label: pair("Korken är nyskuren. Du sa att karaffen redan stod där.", "The cork is freshly cut. You said the decanter was already there."),
    available: (state) => fresh(state, "nc-c-cork") && has(state, "c-last") && has(state, "scene-kitchen-cork") && !has(state, "c-offended"),
    resolve: (state, name) =>
      has(state, "v-saw-clara")
        ? { answer: fill(name, claraPoured), grants: ["c-tone", "nc-poured"] }
        : { answer: fill(name, claraEarly), grants: ["nc-cork-early"] },
  },
  beat(
    "nc-c-window",
    "clara",
    "VITTNE",
    ["Victoria såg dig kvar vid skrivbordet klockan tio.", "Victoria saw you still at the desk at ten."],
    (state) => has(state, "c-last") && has(state, "v-saw-clara") && !has(state, "c-offended"),
    ["nc-slipped"],
    [
      "Hon såg mig från bänken, {n}. Jag gick tillbaka efter en duk. Han levde. Jag gick igen.",
      "She saw me from the bench, {n}. I went back for a cloth. He was alive. I left again.",
    ],
  ),
  beat(
    "nc-c-doubt",
    "clara",
    "ANKLAGA",
    ["Du hällde i glaset och ljög om tiden.", "You poured the glass and lied about the time."],
    (state) => has(state, "c-last") && !has(state, "nc-confessed"),
    ["c-offended"],
    ["Då får ni klara biblioteket utan mig, {n}.", "Then you may finish the library without me, {n}."],
    "shut",
  ),
  beat(
    "nc-c-chain",
    "clara",
    "HELA KEDJAN",
    [
      "Brevet säger upp dig. Victoria såg dig kvar. Korken är din. Glaset är hans.",
      "The letter dismisses you. Victoria saw you stay. The cork is yours. The glass was his.",
    ],
    (state) => has(state, "v-saw-clara") && has(state, "nc-poured") && has(state, "nc-slipped") && allClues(state) && !has(state, "c-offended"),
    ["nc-confessed"],
    [
      "Han skulle skicka bort mig i gryningen, {n}. Jag hade redan nyckeln, och jag hade redan korken. Jag lade det i glaset när han vände sig mot brevet, och jag slog sönder uret så att det skulle se ut som om jag var i köket. Jag var inte i köket.",
      "He was going to send me away at dawn, {n}. I already had the key, and I already had the cork. I put it in the glass when he turned to the letter, and I smashed the clock so it would look as if I were in the kitchen. I was not in the kitchen.",
    ],
  ),
  beat(
    "nc-t-where",
    "thomas",
    "ÖPPNING",
    ["Var befann du dig från klockan tio?", "Where were you from ten o'clock?"],
    () => true,
    ["t-alibi"],
    ["I arbetsrummet, {n}. Fråga lampan om ni inte tror mig.", "In the study, {n}. Ask the lamp if you do not believe me."],
  ),
  beat(
    "nc-t-lamp",
    "thomas",
    "ARBETSRUMMET",
    ["Lampan är kall.", "The lamp is cold."],
    (state) => has(state, "t-alibi") && has(state, "scene-study-cold"),
    ["t-wary", "nc-reed-slipped"],
    [
      "Jag släckte den, {n}. En kall lampa är inte ett glas vin.",
      "I put it out, {n}. A cold lamp is not a glass of wine.",
    ],
  ),
  beat(
    "nc-t-letter",
    "thomas",
    "BEVIS · BREVET",
    ["Brevet handlar om Clara, inte om dig.", "The letter is about Clara, not about you."],
    (state) => has(state, "t-alibi") && clue(state, "letter"),
    ["nc-reed-clear"],
    ["Då har ni rätt person i fel rum, {n}. Jag satt inte vid det skrivbordet.", "Then you have the right person in the wrong room, {n}. I was not at that desk."],
  ),
];

const CHOICES: Record<NightId, Choice[]> = {
  victoria: VICTORIA,
  edward: EDWARD,
  clara: CLARA,
};

export function nightChoices(culprit: CulpritId, suspectId: SuspectId, state: InquiryState) {
  if (culprit === "thomas") return [];
  return CHOICES[culprit].filter((choice) => choice.suspectId === suspectId && choice.available(state));
}

type Note = { flag: string; title: string; text: string };

function note(flag: string, title: [string, string], text: [string, string]): Note {
  return { flag, title: pair(title[0], title[1]), text: pair(text[0], text[1]) };
}

const COLD = note(
  "scene-study-cold",
  ["Kall lampa", "Cold lamp"],
  ["Arbetsrummets lampa är kall. Ingen satt och skrev där den senaste timmen.", "The study lamp is cold. No one sat writing there during the last hour."],
);
const BOOK = note(
  "scene-study-book",
  ["Oöppnad bok", "Unopened book"],
  ["Räkenskapsboken i arbetsrummet har inte använts i kväll.", "The account book in the study has not been used tonight."],
);
const GLASS = note(
  "scene-reed-glass",
  ["Orört glas", "Untouched glass"],
  ["Reeds glas i matsalen är fullt. Bara Alistairs glas lämnade bordet.", "Reed's glass in the dining room is full. Only Alistair's glass left the table."],
);
const CHAIR = note(
  "scene-dining-left",
  ["Stolen", "The chair"],
  ["Alistairs stol är vänd mot biblioteket. Han gick dit och satte sig inte igen.", "Alistair's chair is turned toward the library. He went there and did not sit down again."],
);
const CORK = note(
  "scene-kitchen-cork",
  ["Korken i köket", "The cork in the kitchen"],
  ["En nyskuren kork ligger på skärbrädan. Karaffen är borta.", "A freshly cut cork lies on the board. The decanter is gone."],
);
const GAP = note(
  "scene-kitchen-gap",
  ["Dammet", "The dust"],
  ["Ringen i dammet visar att karaffen togs från hyllan i kväll.", "The ring in the dust shows the decanter was taken from the shelf tonight."],
);

const NOTES: Record<NightId, Note[]> = {
  victoria: [
    COLD,
    BOOK,
    GLASS,
    CHAIR,
    CORK,
    GAP,
    note("v-alibi", ["Victoria", "Victoria"], ["Säger att hon var på terrassen efter grälet.", "Says she was on the terrace after the quarrel."]),
    note("v-will", ["Huset", "The house"], ["Grälet gällde att Alistair inte tänkte ge henne herrgården.", "The quarrel was about Alistair not meaning to give her the manor."]),
    note("nv-knew-letter", ["Brevet", "The letter"], ["Victoria vet att brevet nekar henne huset. Hon säger att hon inte gick in igen.", "Victoria knows the letter refuses her the house. She says she did not go back in."]),
    note("nv-returned", ["Hon gick tillbaka", "She went back"], ["När tonen är lugn medger Victoria att spåren är hennes och att hon gick in igen.", "When the tone is calm, Victoria admits the prints are hers and that she went back in."]),
    note("nv-denied", ["Spåren förnekade", "The prints denied"], ["Victoria säger att spåren slutar vid bänken. Gruset säger något annat.", "Victoria says the prints end at the bench. The gravel says otherwise."]),
    note("v-hostile", ["Victoria tiger", "Victoria is silent"], ["Anklagelsen fick henne att sluta tala.", "The accusation made her stop speaking."]),
    note("c-saw-v", ["I dörren", "In the doorway"], ["Clara såg Victoria komma in från terrassen när hon själv gick ut.", "Clara saw Victoria come in from the terrace as she herself went out."]),
    note("c-clock-intact", ["Uret vid nio", "The clock at nine"], ["Clara drog upp uret klockan nio. Glaset var helt.", "Clara wound the clock at nine. The glass was intact."]),
    note("c-wine-fresh", ["Ny karaff", "New decanter"], ["Clara korkade upp vinet själv. Glaset rördes efter att hon gått.", "Clara drew the cork herself. The glass was touched after she left."]),
    note("nv-edward-hid", ["Utkastet", "The draft"], ["Edward gömde utkastet för att Victoria inte skulle se att huset inte skulle bli hennes.", "Edward hid the draft so Victoria would not see that the house would not be hers."]),
    note("scene-codicil", ["Lådan", "The drawer"], ["Utkastet ger Victoria ett underhåll, inte herrgården.", "The draft gives Victoria an allowance, not the manor."]),
    note("scene-terrace-prints", ["Fotspåren", "The prints"], ["Spåren går till bänken och vänder tillbaka mot dörren.", "The prints go to the bench and turn back toward the door."]),
    note("t-alibi", ["Reeds alibi", "Reed's alibi"], ["Thomas säger att han satt i arbetsrummet från klockan tio.", "Thomas says he was in the study from ten o'clock."]),
    note("nv-reed-slipped", ["Korridoren", "The corridor"], ["Thomas medger att han släckte och lämnade arbetsrummet en stund.", "Thomas admits he put out the lamp and left the study for a while."]),
    note("nv-confessed", ["Erkännande", "Confession"], ["Victoria har erkänt glaset, uret och att hon gick tillbaka in.", "Victoria has confessed the glass, the clock, and that she went back in."]),
  ],
  edward: [
    COLD,
    BOOK,
    GLASS,
    CHAIR,
    CORK,
    GAP,
    note("v-alibi", ["Victoria", "Victoria"], ["Säger att hon stannade på bänken.", "Says she stayed on the bench."]),
    note("v-will", ["Arvet", "The inheritance"], ["Victoria hörde att Edward hade rört arvet. Sedan gick hon ut.", "Victoria heard that Edward had touched the inheritance. Then she went out."]),
    note("ne-victoria-out", ["Spåren ut", "The prints outward"], ["Victoria säger att spåren är hennes och att de inte vänder tillbaka.", "Victoria says the prints are hers and that they do not turn back."]),
    note("scene-terrace-prints", ["Fotspåren", "The prints"], ["Spåren slutar vid bänken. Inget vänder tillbaka mot dörren.", "The prints end at the bench. Nothing turns back toward the door."]),
    note("e-alibi", ["Edward", "Edward"], ["Säger att han var på sitt rum och inte lämnade det.", "Says he was in his room and did not leave it."]),
    note("ne-denied", ["Arvodet", "The fee"], ["Edward säger att arvodet var avtalat och att brevet bara är vrede.", "Edward says the fee was agreed and that the letter is only anger."]),
    note("ne-forge", ["Handstilen", "The hand"], ["Utkastet i lådan är skrivet av Edward. Alistair har inte signerat det.", "The draft in the drawer was written by Edward. Alistair has not signed it."]),
    note("ne-admitted", ["Papperet", "The paper"], ["Edward medger att han gick för att ta tillbaka utkastet.", "Edward admits he went to take the draft back."]),
    note("ne-train", ["Sista tåget", "The last train"], ["Biljetten gäller sista tåget mot London i kväll.", "The ticket is for the last train to London tonight."]),
    note("scene-codicil", ["Lådan", "The drawer"], ["Utkastet i Edwards handstil flyttar kapitalet till honom själv.", "The draft in Edward's hand moves the capital to himself."]),
    note("scene-edward-ticket", ["Biljetten", "The ticket"], ["I väskan ligger en biljett för sista tåget i kväll.", "In the bag lies a ticket for the last train tonight."]),
    note("e-defensive", ["Edward sluter sig", "Edward closes up"], ["Anklagelsen fick honom att sluta hjälpa.", "The accusation made him stop helping."]),
    note("c-saw-e", ["I dörren", "In the doorway"], ["Clara såg Edward gå in när hon gick ut.", "Clara saw Edward go in as she went out."]),
    note("c-clock-intact", ["Uret vid nio", "The clock at nine"], ["Clara drog upp uret klockan nio. Glaset var helt.", "Clara wound the clock at nine. The glass was intact."]),
    note("c-wine-fresh", ["Ny karaff", "New decanter"], ["Clara korkade upp vinet själv. Bara den som blev kvar kunde röra glaset.", "Clara drew the cork herself. Only the person who stayed could have touched the glass."]),
    note("t-alibi", ["Reeds alibi", "Reed's alibi"], ["Thomas säger att han satt i arbetsrummet från klockan tio.", "Thomas says he was in the study from ten o'clock."]),
    note("ne-reed-slipped", ["Korridoren", "The corridor"], ["Thomas medger att han släckte och gick en sväng.", "Thomas admits he put out the lamp and took a walk."]),
    note("ne-confessed", ["Erkännande", "Confession"], ["Edward har erkänt glaset, uret och att tåget skulle ta honom före gryningen.", "Edward has confessed the glass, the clock, and that the train would take him before dawn."]),
  ],
  clara: [
    COLD,
    BOOK,
    GLASS,
    CHAIR,
    CORK,
    GAP,
    note("v-alibi", ["Victoria", "Victoria"], ["Säger att hon satt på bänken tills skriket kom.", "Says she sat on the bench until the scream came."]),
    note("v-saw-clara", ["Fönstret", "The window"], ["Victoria såg Clara kvar vid skrivbordet när klockan slog tio.", "Victoria saw Clara still at the desk when the clock struck ten."]),
    note("scene-shawl", ["Sjalen", "The shawl"], ["Från bänken syns skrivbordet klart genom det öppna fönstret.", "From the bench the desk is clearly visible through the open window."]),
    note("scene-terrace-prints", ["Fotspåren", "The prints"], ["Spåren slutar vid bänken. Victoria gick inte in.", "The prints end at the bench. Victoria did not go in."]),
    note("nc-edward-knew", ["Uppsägningen", "The dismissal"], ["Edward vet att Alistair tänkte säga upp Clara för källarkontot.", "Edward knows Alistair meant to dismiss Clara over the cellar account."]),
    note("nc-drawer-seen", ["Tjänstebrevet", "The service letter"], ["Det osignerade brevet i lådan tar nyckeln från Clara.", "The unsigned letter in the drawer takes the key from Clara."]),
    note("scene-codicil", ["Lådan", "The drawer"], ["I lådan ligger ett osignerat tjänstebrev till Clara.", "In the drawer lies an unsigned service letter to Clara."]),
    note("c-last", ["Kvart i tio", "Quarter to ten"], ["Clara säger att hon lämnade honom då och att karaffen redan stod där.", "Clara says she left him then and that the decanter was already there."]),
    note("nc-poured", ["Korken", "The cork"], ["Clara medger att hon korkade upp vinet i kväll och gick tillbaka med det.", "Clara admits she drew the cork tonight and went back with it."]),
    note("nc-cork-early", ["Korken förnekad", "The cork denied"], ["Clara säger att korken skars före middagen.", "Clara says the cork was cut before dinner."]),
    note("nc-slipped", ["Duken", "The cloth"], ["Clara säger att hon gick tillbaka efter en duk och att han fortfarande levde.", "Clara says she went back for a cloth and that he was still alive."]),
    note("c-offended", ["Clara tiger", "Clara is silent"], ["Anklagelsen fick henne att sluta hjälpa.", "The accusation made her stop helping."]),
    note("t-alibi", ["Reeds alibi", "Reed's alibi"], ["Thomas säger att han satt i arbetsrummet från klockan tio.", "Thomas says he was in the study from ten o'clock."]),
    note("nc-reed-slipped", ["Kall lampa", "Cold lamp"], ["Thomas medger att han släckte. Han kallar det inte ett glas vin.", "Thomas admits he put the lamp out. He does not call it a glass of wine."]),
    note("nc-confessed", ["Erkännande", "Confession"], ["Clara har erkänt glaset, uret och att hon inte var i köket.", "Clara has confessed the glass, the clock, and that she was not in the kitchen."]),
  ],
};

export function nightNotes(culprit: CulpritId, state: InquiryState) {
  if (culprit === "thomas") return [];
  return NOTES[culprit].filter((item) => state.flags.includes(item.flag));
}

function slots(rows: { id: string; time: string; lines: string[] }[]): TimelineSlot[] {
  return rows.map((slot) => ({
    id: slot.id,
    time: tr(slot.time),
    lines: slot.lines.slice(0, 2).map((item) => tr(item)),
  }));
}

const LINE = {
  house: pair("Victoria och Alistair grälar om huset.", "Victoria and Alistair quarrel about the house."),
  out: pair("Victoria går ut efter grälet.", "Victoria goes out after the quarrel."),
  edwardTouch: pair("Victoria hör att Edward har rört arvet.", "Victoria hears that Edward has touched the inheritance."),
  bench: pair("Victoria stannar på bänken.", "Victoria stays on the bench."),
  clock: pair("Clara drar upp uret. Det visar rätt tid.", "Clara winds the clock. It shows the right time."),
  sawV: pair("Clara ser Victoria komma in från terrassen.", "Clara sees Victoria come in from the terrace."),
  sawE: pair("Clara ser Edward gå in.", "Clara sees Edward go in."),
  left: pair("Clara säger att hon lämnade Alistair levande.", "Clara says she left Alistair alive."),
  wine: pair("Karaffen var nyöppnad.", "The decanter had just been opened."),
  study: pair("Thomas säger att han sitter i arbetsrummet.", "Thomas says he is sitting in the study."),
  lamp: pair("Lampan i arbetsrummet är kall.", "The lamp in the study is cold."),
  hands: pair("Visarna är böjda till 22:15.", "The hands are bent to 10:15."),
  window: pair("Victoria ser Clara kvar vid skrivbordet.", "Victoria sees Clara still at the desk."),
  poured: pair("Clara medger att hon gick tillbaka med vinet.", "Clara admits she went back with the wine."),
};

export function nightTimeline(culprit: CulpritId, state: InquiryState): TimelineSlot[] {
  const dinner: string[] = [];
  const nine: string[] = [];
  const quarter: string[] = [];
  const ten: string[] = [];
  const death: string[] = [];
  if (culprit === "victoria") {
    if (has(state, "v-will")) dinner.push(LINE.house);
    else if (has(state, "v-alibi")) dinner.push(LINE.out);
  } else if (culprit === "edward") {
    if (has(state, "v-will")) dinner.push(LINE.edwardTouch);
    else if (has(state, "v-alibi")) dinner.push(LINE.bench);
  } else if (has(state, "v-alibi")) dinner.push(LINE.bench);
  if (has(state, "c-clock-intact")) nine.push(LINE.clock);
  if (culprit === "victoria" && has(state, "c-saw-v")) quarter.push(LINE.sawV);
  if (culprit === "edward" && has(state, "c-saw-e")) quarter.push(LINE.sawE);
  if (culprit === "clara" && has(state, "c-last")) quarter.push(LINE.left);
  if (has(state, "c-wine-fresh") || has(state, "scene-kitchen-cork")) quarter.push(LINE.wine);
  if (has(state, "t-alibi")) ten.push(LINE.study);
  if (has(state, "scene-study-cold")) ten.push(LINE.lamp);
  if (culprit === "clara" && has(state, "v-saw-clara")) ten.push(LINE.window);
  if (culprit === "clara" && has(state, "nc-poured")) quarter.push(LINE.poured);
  if (clue(state, "clock")) death.push(LINE.hands);
  return slots([
    { id: "table", time: "Bordet", lines: dinner },
    { id: "nine", time: "21:00", lines: nine },
    { id: "half", time: "21:30", lines: [] },
    { id: "quarter", time: "21:45", lines: quarter },
    { id: "ten", time: "22:00", lines: ten },
    { id: "death", time: "22:15", lines: death },
  ]);
}

const CLASH = {
  prints: pair("Terrassen och spåren tillbaka går inte ihop.", "The terrace and the prints turning back do not agree."),
  study: pair("Klockan tio och arbetsrummet går inte ihop.", "Ten o'clock and the study do not agree."),
  edward: pair("Edwards rum och dörren till biblioteket går inte ihop.", "Edward's room and the library door do not agree."),
  clara: pair("Kvart i tio och fönstret klockan tio går inte ihop.", "Quarter to ten and the window at ten o'clock do not agree."),
};

export function nightClashes(culprit: CulpritId, state: InquiryState) {
  const lines: string[] = [];
  if (culprit === "victoria" && (has(state, "nv-denied") || has(state, "nv-out")) && has(state, "scene-terrace-prints") && !has(state, "nv-returned")) {
    lines.push(CLASH.prints);
  }
  if (has(state, "t-alibi") && has(state, "scene-study-cold")) lines.push(CLASH.study);
  if (culprit === "edward" && has(state, "e-alibi") && has(state, "c-saw-e")) lines.push(CLASH.edward);
  if (culprit === "clara" && has(state, "nc-claimed-left") && has(state, "v-saw-clara")) lines.push(CLASH.clara);
  return lines.map((item) => tr(item));
}

export function nightPath(culprit: CulpritId, state: InquiryState) {
  const parts: string[] = [];
  if (culprit === "victoria") {
    if (has(state, "nv-confessed")) parts.push(pair("Victoria erkände när kedjan var hel", "Victoria confessed when the chain was whole"));
    else if (has(state, "nv-returned")) parts.push(pair("Victoria medgav att hon gick tillbaka in", "Victoria admitted she went back in"));
    if (has(state, "c-saw-v")) parts.push(pair("Clara såg henne i dörren", "Clara saw her in the doorway"));
    if (has(state, "scene-terrace-prints")) parts.push(pair("Spåren på terrassen vände tillbaka", "The prints on the terrace turned back"));
    if (has(state, "v-hostile")) parts.push(pair("Victoria teg efter anklagelsen", "Victoria went silent after the accusation"));
  } else if (culprit === "edward") {
    if (has(state, "ne-confessed")) parts.push(pair("Edward erkände när kedjan var hel", "Edward confessed when the chain was whole"));
    else if (has(state, "ne-admitted")) parts.push(pair("Edward medgav att han gick efter utkastet", "Edward admitted he went after the draft"));
    if (has(state, "c-saw-e")) parts.push(pair("Clara såg honom gå in", "Clara saw him go in"));
    if (has(state, "ne-train")) parts.push(pair("Biljetten gällde i kväll", "The ticket was for tonight"));
    if (has(state, "e-defensive")) parts.push(pair("Edward stängde sig när du anklagade honom", "Edward closed up when you accused him"));
  } else {
    if (has(state, "nc-confessed")) parts.push(pair("Clara erkände när kedjan var hel", "Clara confessed when the chain was whole"));
    else if (has(state, "nc-poured")) parts.push(pair("Clara medgav att hon gick tillbaka med vinet", "Clara admitted she went back with the wine"));
    if (has(state, "v-saw-clara")) parts.push(pair("Victoria såg henne kvar vid skrivbordet", "Victoria saw her still at the desk"));
    if (has(state, "scene-kitchen-cork")) parts.push(pair("Du hittade den nyskurna korken", "You found the freshly cut cork"));
    if (has(state, "c-offended")) parts.push(pair("Clara teg efter anklagelsen", "Clara went silent after the accusation"));
  }
  if (has(state, "scene-study-cold")) parts.push(pair("Lampan i arbetsrummet var kall", "The lamp in the study was cold"));
  if (parts.length === 0) return tr("Du rörde knappt vid förhören. Fallet förblev en yta.");
  return `${parts.map((part) => tr(part)).join(". ")}.`;
}

const LEADS: Record<NightId, { suspectId: SuspectId; flag: string; stageId: string; room: string }[]> = {
  victoria: [
    { suspectId: "victoria", flag: "scene-terrace-prints", stageId: "gravel-follow", room: "Terrassen" },
    { suspectId: "edward", flag: "scene-codicil", stageId: "drawer-open", room: "Edwards rum" },
    { suspectId: "thomas", flag: "scene-study-cold", stageId: "lamp-touch", room: "Arbetsrummet" },
  ],
  edward: [
    { suspectId: "edward", flag: "scene-codicil", stageId: "drawer-open", room: "Edwards rum" },
    { suspectId: "edward", flag: "scene-edward-ticket", stageId: "bag-open", room: "Edwards rum" },
    { suspectId: "thomas", flag: "scene-study-cold", stageId: "lamp-touch", room: "Arbetsrummet" },
  ],
  clara: [
    { suspectId: "victoria", flag: "scene-shawl", stageId: "bench-shawl", room: "Terrassen" },
    { suspectId: "clara", flag: "scene-kitchen-cork", stageId: "cork-cut", room: "Köket" },
    { suspectId: "edward", flag: "scene-codicil", stageId: "drawer-open", room: "Edwards rum" },
    { suspectId: "thomas", flag: "scene-study-cold", stageId: "lamp-touch", room: "Arbetsrummet" },
  ],
};

export function nightRooms(culprit: CulpritId, suspectId: SuspectId, state: InquiryState, examined: string[]) {
  if (culprit === "thomas") return [];
  const open = nightChoices(culprit, suspectId, state).length;
  const rooms: string[] = [];
  for (const lead of LEADS[culprit]) {
    if (lead.suspectId !== suspectId || examined.includes(lead.stageId) || has(state, lead.flag)) continue;
    const next: InquiryState = { ...state, flags: [...state.flags, lead.flag] };
    if (nightChoices(culprit, suspectId, next).length > open && !rooms.includes(lead.room)) rooms.push(lead.room);
  }
  return rooms;
}

function verdict(title: string, kicker: string, path: string, text: string): Verdict {
  return { title, kicker, path, text };
}

const T = {
  closed: "FALL 001 / AVSLUTAT",
  proof: "FALL 001 / BEVIS",
  thin: "FALL 001 / TUNNT",
  lost: "FALL 001 / FÖRLORAT",
  wrong: "FALL 001 / FEL",
  open: "FALL 001 / ÖPPET",
};

export function nightJudge(culprit: CulpritId, target: VerdictTarget, state: InquiryState, name: string): Verdict {
  const path = nightPath(culprit, state);
  if (culprit === "victoria") return judgeVictoria(target, state, name, path);
  if (culprit === "edward") return judgeEdward(target, state, name, path);
  return judgeClara(target, state, name, path);
}

function judgeVictoria(target: VerdictTarget, state: InquiryState, name: string, path: string): Verdict {
  const proof = allClues(state) && has(state, "scene-terrace-prints") && has(state, "c-saw-v") && clue(state, "letter");
  if (target === "victoria") {
    if (has(state, "nv-confessed")) {
      return verdict(
        "Erkännandet",
        T.closed,
        path,
        fill(name, pair(
          "{n}, hon slutar spela. Victoria gick tillbaka från terrassen, lade giftet i glaset och slog sönder uret så att visarna skulle stanna på 22:15. Huset skulle ha gått ifrån henne före gryningen.",
          "{n}, she stops performing. Victoria went back from the terrace, put the poison in the glass and smashed the clock so the hands would stop at 10:15. The house was going to be taken from her before dawn.",
        )),
      );
    }
    if (proof) {
      return verdict(
        "Åtalet håller",
        T.proof,
        path,
        fill(name, pair(
          "{n}, hon nekar en sista gång. Spåren vänder tillbaka, Clara såg henne komma in, och brevet nekar henne huset. Ni lade aldrig fram den sista frågan. Bevisen räcker ändå.",
          "{n}, she denies it one last time. The prints turn back, Clara saw her come in, and the letter refuses her the house. You never put the last question. The evidence is enough anyway.",
        )),
      );
    }
    if (has(state, "c-saw-v") || has(state, "nv-returned") || has(state, "scene-terrace-prints")) {
      return verdict(
        pair("Rätt namn, fel grepp", "Right name, wrong grip"),
        T.thin,
        path,
        fill(name, pair(
          "{n}, namnet är rätt och kedjan är inte sluten. Spåren, Claras dörr och brevet behöver ligga i samma akt. Utan dem lämnar hon huset som en arg syster, inte som den skyldiga.",
          "{n}, the name is right and the chain is not closed. The prints, Clara's doorway and the letter need to lie in the same file. Without them she leaves the house as an angry sister, not as the guilty one.",
        )),
      );
    }
    return verdict(
      pair("Hon går fri", "She walks free"),
      T.lost,
      path,
      fill(name, pair(
        "{n}, Victoria är rätt namn och fel akt. Ett gräl räcker inte. Hon tar sjalen från bänken och går in, som en gäst i sitt eget hus.",
        "{n}, Victoria is the right name and the wrong file. A quarrel is not enough. She takes the shawl from the bench and goes inside, like a guest in her own house.",
      )),
    );
  }
  if (target !== "none" && (has(state, "nv-confessed") || proof)) {
    return verdict(
      pair("Fel hand", "The wrong hand"),
      T.wrong,
      path,
      fill(name, pair(
        "{n}, bevisen pekade redan på Victoria. Du valde någon annan. Hon hör domen från trappan, tar nycklarna och låser biblioteket efter sig.",
        "{n}, the evidence already pointed to Victoria. You chose someone else. She hears the verdict from the stairs, takes the keys and locks the library behind her.",
      )),
    );
  }
  return verdict(
        "Natten tar slut",
    T.open,
    path,
    fill(name, pair(
      "{n}, ni pekade åt ett annat håll än spåren. Victoria lämnar terrassen när gryningen kommer. Fallet är inte slutet.",
      "{n}, you pointed another way than the prints. Victoria leaves the terrace when dawn comes. The case is not closed.",
    )),
  );
}

function judgeEdward(target: VerdictTarget, state: InquiryState, name: string, path: string): Verdict {
  const proof = allClues(state) && has(state, "scene-codicil") && has(state, "c-saw-e") && clue(state, "letter");
  if (target === "edward") {
    if (has(state, "ne-confessed")) {
      return verdict(
        "Erkännandet",
        T.closed,
        path,
        fill(name, pair(
          "{n}, han lägger ner pennan. Edward skrev utkastet, gick in när Clara gick ut, lade giftet i glaset och ställde uret på 22:15. Sista tåget skulle ha tagit honom före gryningen.",
          "{n}, he puts down the pen. Edward wrote the draft, went in as Clara went out, put the poison in the glass and set the clock to 10:15. The last train would have taken him before dawn.",
        )),
      );
    }
    if (proof) {
      return verdict(
        "Åtalet håller",
        T.proof,
        path,
        fill(name, pair(
          "{n}, han nekar en sista gång. Handstilen är hans, Clara såg honom gå in, och brevet säger att kvällen skulle göra slut på det. Ni behövde inte höra resten. Bevisen räcker.",
          "{n}, he denies it one last time. The hand is his, Clara saw him go in, and the letter says the evening would end it. You did not need to hear the rest. The evidence is enough.",
        )),
      );
    }
    if (has(state, "ne-forge") || has(state, "c-saw-e") || has(state, "ne-train")) {
      return verdict(
        pair("Rätt namn, fel grepp", "Right name, wrong grip"),
        T.thin,
        path,
        fill(name, pair(
          "{n}, namnet är rätt och papperet är inte nog. Lådan, dörren och biljetten behöver ligga tillsammans. Utan dem lämnar han huset som en rädd advokat.",
          "{n}, the name is right and the paper is not enough. The drawer, the door and the ticket need to lie together. Without them he leaves the house as a frightened lawyer.",
        )),
      );
    }
    return verdict(
        "Han går fri",
      T.lost,
      path,
      fill(name, pair(
        "{n}, Edward är rätt namn och fel akt. Ett försvunnet papper är inte gift. Han stänger väskan och går mot stationen i god tid.",
        "{n}, Edward is the right name and the wrong file. A missing paper is not poison. He closes the bag and walks toward the station in good time.",
      )),
    );
  }
  if (target !== "none" && (has(state, "ne-confessed") || proof)) {
    return verdict(
      pair("Fel hand", "The wrong hand"),
      T.wrong,
      path,
      fill(name, pair(
        "{n}, bevisen pekade redan på Edward. Du valde någon annan. Han hör domen, tar utkastet ur lådan och hinner med sista tåget.",
        "{n}, the evidence already pointed to Edward. You chose someone else. He hears the verdict, takes the draft from the drawer and catches the last train.",
      )),
    );
  }
  return verdict(
        "Natten tar slut",
    T.open,
    path,
    fill(name, pair(
      "{n}, ni pekade åt ett annat håll än lådan. Edward lämnar huset med väskan. Fallet är inte slutet.",
      "{n}, you pointed another way than the drawer. Edward leaves the house with the bag. The case is not closed.",
    )),
  );
}

function judgeClara(target: VerdictTarget, state: InquiryState, name: string, path: string): Verdict {
  const proof = allClues(state) && has(state, "v-saw-clara") && (has(state, "nc-poured") || has(state, "scene-kitchen-cork")) && clue(state, "letter");
  if (target === "clara") {
    if (has(state, "nc-confessed")) {
      return verdict(
        "Erkännandet",
        T.closed,
        path,
        fill(name, pair(
          "{n}, hon tar av sig förklädet. Clara korkade upp vinet, gick tillbaka, lade giftet i glaset och slog sönder uret. Uppsägningen skulle ha skickat bort henne i gryningen.",
          "{n}, she takes off the apron. Clara drew the cork, went back, put the poison in the glass and smashed the clock. The dismissal would have sent her away at dawn.",
        )),
      );
    }
    if (proof) {
      return verdict(
        "Åtalet håller",
        T.proof,
        path,
        fill(name, pair(
          "{n}, hon nekar en sista gång. Victoria såg henne kvar vid skrivbordet, korken är nyskuren, och brevet tar nyckeln ifrån henne. Ni lade aldrig fram den sista frågan. Bevisen räcker ändå.",
          "{n}, she denies it one last time. Victoria saw her still at the desk, the cork is freshly cut, and the letter takes the key from her. You never put the last question. The evidence is enough anyway.",
        )),
      );
    }
    if (has(state, "v-saw-clara") || has(state, "nc-poured") || has(state, "scene-kitchen-cork")) {
      return verdict(
        pair("Rätt namn, fel grepp", "Right name, wrong grip"),
        T.thin,
        path,
        fill(name, pair(
          "{n}, namnet är rätt och köket är inte nog. Fönstret, korken och brevet behöver ligga i samma akt. Utan dem lämnar hon huset som den sista som bar in vinet.",
          "{n}, the name is right and the kitchen is not enough. The window, the cork and the letter need to lie in the same file. Without them she leaves the house as the last person who carried in the wine.",
        )),
      );
    }
    return verdict(
      pair("Hon går fri", "She walks free"),
      T.lost,
      path,
      fill(name, pair(
        "{n}, Clara är rätt namn och fel akt. Att bära in en karaff är inte att tömma ett glas. Hon tar nyckeln och går ner i källaren, som om morgonen vore en vanlig morgon.",
        "{n}, Clara is the right name and the wrong file. Carrying in a decanter is not emptying a glass. She takes the key and goes down to the cellar, as if the morning were an ordinary morning.",
      )),
    );
  }
  if (target !== "none" && (has(state, "nc-confessed") || proof)) {
    return verdict(
      pair("Fel hand", "The wrong hand"),
      T.wrong,
      path,
      fill(name, pair(
        "{n}, bevisen pekade redan på Clara. Du valde någon annan. Hon hör domen från köket, korkar en ny flaska och låser källaren inifrån.",
        "{n}, the evidence already pointed to Clara. You chose someone else. She hears the verdict from the kitchen, draws a new cork and locks the cellar from the inside.",
      )),
    );
  }
  return verdict(
        "Natten tar slut",
    T.open,
    path,
    fill(name, pair(
      "{n}, ni pekade åt ett annat håll än fönstret. Clara släcker i köket. Fallet är inte slutet.",
      "{n}, you pointed another way than the window. Clara puts out the light in the kitchen. The case is not closed.",
    )),
  );
}

function norm(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function mentions(question: string, phrases: string[]) {
  const text = ` ${norm(question)} `;
  return phrases.some((phrase) => text.includes(` ${norm(phrase)} `));
}

const VOICE = {
  shut: pair("Jag har inget mer att säga till dig.", "I have nothing more to say to you."),
  who: pair("Jag såg inte vem. Om jag visste det skulle jag inte stå här.", "I did not see who. If I knew, I would not be standing here."),
  deny: pair("Nej, {n}. Jag lämnade honom levande.", "No, {n}. I left him alive."),
  again: pair("Du har redan hört det, {n}. Jag tänker inte säga det en gång till.", "You have already heard it, {n}. I will not say it again."),
  straight: pair("Fråga rakt, {n}. Jag fyller inte i luckorna åt dig.", "Ask plainly, {n}. I will not fill in the gaps for you."),
  seen: pair("Jag har sagt det jag tänker ge bort, {n}.", "I have said what I mean to give away, {n}."),
};

export function nightVoice(input: {
  suspectId: SuspectId;
  question: string;
  name: string;
  clues: string[];
  flags: string[];
}) {
  const culprit = getCulprit();
  const question = input.question;
  const name = input.name;
  const flags = input.flags;
  const marked = (flag: string) => flags.includes(flag);
  const said = (template: string) => fill(name, template);
  if (
    (input.suspectId === "victoria" && marked("v-hostile")) ||
    (input.suspectId === "edward" && marked("e-defensive")) ||
    (input.suspectId === "clara" && marked("c-offended"))
  ) {
    return VOICE.shut;
  }
  if (marked("nv-confessed") || marked("ne-confessed") || marked("nc-confessed")) {
    if (input.suspectId === culprit) return said(VOICE.again);
  }
  if (mentions(question, ["vem dodade", "vem mordade", "vem var det", "who killed", "who murdered", "who did it", "who was it"])) {
    return VOICE.who;
  }
  if (mentions(question, ["dodade du", "var det du", "du mordade", "skyldig", "did you kill", "you killed", "you murdered", "guilty"])) {
    return said(VOICE.deny);
  }
  if (input.suspectId === "victoria") return said(victoriaVoice(culprit, question, flags, marked));
  if (input.suspectId === "edward") return said(edwardVoice(culprit, question, flags, marked));
  if (input.suspectId === "clara") return said(claraVoice(question, flags, marked));
  return said(thomasVoice(culprit, question, flags, marked));
}

const SAY = {
  printsEnd: pair("Spåren är mina, {n}. De slutar vid bänken. Jag gick inte in igen.", "The prints are mine, {n}. They end at the bench. I did not go back in."),
  noPrints: pair("Terrassen har jag redan talat om. Gissa inte fram spår jag inte har sett.", "I have already spoken about the terrace. Do not invent prints I have not seen."),
  terraceAgain: pair("På terrassen, {n}. Det har jag redan lagt fram.", "On the terrace, {n}. I have already set that down."),
  benchAgain: pair("På bänken, {n}. Jag stannade där.", "On the bench, {n}. I stayed there."),
  houseQuarrel: pair("Grälet gällde huset. Han tänkte inte ge det till mig.", "The quarrel was about the house. He was not going to give it to me."),
  edwardTouch: pair("Han sa att Edward hade rört arvet. Sedan gick jag ut.", "He said Edward had touched the inheritance. Then I went out."),
  sawClara: pair("Jag såg Clara vid skrivbordet när klockan slog tio, {n}.", "I saw Clara at the desk when the clock struck ten, {n}."),
  readLetter: pair("Jag har läst det. Jag gick ut. Jag har sagt att jag inte gick in igen.", "I have read it. I went out. I have said I did not go back in."),
  hidForHer: pair("Jag gömde utkastet för Victorias skull, {n}. Inte för min.", "I hid the draft for Victoria's sake, {n}. Not for mine."),
  dismissalDraft: pair("Det var uppsägningen jag inte skrev rent, {n}.", "It was the dismissal I did not write out, {n}."),
  lastTrain: pair("Sista tåget i kväll, {n}. Jag åkte inte.", "The last train tonight, {n}. I did not take it."),
  morningTrain: pair("Första tåget i morgon bitti, {n}. En resa, inte en flykt.", "The first train tomorrow morning, {n}. A journey, not a flight."),
  inRoom: pair("På mitt rum, {n}. Med papperen.", "In my room, {n}. With the papers."),
  feeAgreed: pair("Arvodet var avtalat, {n}. Brevet är hans vrede.", "The fee was agreed, {n}. The letter is his anger."),
  didNotWrite: pair("Han ville att jag skulle skriva uppsägningen. Jag skrev den inte.", "He wanted me to write the dismissal. I did not write it."),
  sawVictoria: pair("Victoria, {n}. Hon kom in från terrassen.", "Victoria, {n}. She came in from the terrace."),
  sawEdward: pair("Edward, {n}. Han kom in när jag gick ut.", "Edward, {n}. He came in as I went out."),
  someoneDoor: pair("Någon mötte mig i dörren. Namnet ger jag när du frågar just det.", "Someone met me in the doorway. I will give the name when you ask that and nothing else."),
  clockNine: pair("Klockan nio var glaset helt, {n}. Jag drog upp det själv.", "At nine the glass was intact, {n}. I wound it myself."),
  wineNew: pair("Karaffen var ny, {n}. Jag korkade upp den själv.", "The decanter was new, {n}. I drew the cork myself."),
  leftAlive: pair("Kvart i tio, {n}. Han levde. Han skrev.", "Quarter to ten, {n}. He was alive. He was writing."),
  cloth: pair("Jag gick tillbaka efter en duk, {n}. Han levde.", "I went back for a cloth, {n}. He was alive."),
  lampOut: pair("Jag släckte, {n}. Jag var inte vid hans glas.", "I put it out, {n}. I was not at his glass."),
  inStudy: pair("I arbetsrummet från klockan tio, {n}.", "In the study from ten o'clock, {n}."),
  notMyLetter: pair("Brevet är inte mitt, {n}. Det gäller huset.", "The letter is not mine, {n}. It concerns the house."),
  namesEdward: pair("Brevet namnger Edward, {n}. Inte mig.", "The letter names Edward, {n}. Not me."),
  aboutPost: pair("Brevet handlar om tjänsten, {n}. Inte om mig.", "The letter is about the post, {n}. Not about me."),
};

function victoriaVoice(culprit: CulpritId, question: string, flags: string[], marked: (flag: string) => boolean) {
  if (mentions(question, ["fotspar", "sparen", "gruset", "banken", "footprints", "tracks", "gravel", "bench"])) {
    if (culprit === "victoria" && marked("nv-returned")) return victoriaReturned;
    if (culprit === "victoria" && marked("scene-terrace-prints")) return victoriaDenied;
    if (marked("scene-terrace-prints") || marked("ne-victoria-out")) return SAY.printsEnd;
    return SAY.noPrints;
  }
  if (mentions(question, ["var befann", "var var", "alibi", "tradgarden", "terrassen", "where were you", "garden", "terrace"])) {
    if (marked("v-alibi")) return culprit === "victoria" ? SAY.terraceAgain : SAY.benchAgain;
  }
  if (mentions(question, ["gralet", "gral", "testamentet", "arvet", "huset", "quarrel", "the will", "inheritance", "the house"])) {
    if (marked("v-will") && culprit === "victoria") return SAY.houseQuarrel;
    if (marked("v-will") && culprit === "edward") return SAY.edwardTouch;
  }
  if (mentions(question, ["clara", "fonstret", "skrivbordet", "window", "the desk"])) {
    if (marked("v-saw-clara")) return SAY.sawClara;
  }
  if (mentions(question, ["brevet", "brev", "letter"])) {
    if (marked("nv-knew-letter")) return SAY.readLetter;
  }
  return flags.length > 0 ? VOICE.seen : VOICE.straight;
}

function edwardVoice(culprit: CulpritId, question: string, flags: string[], marked: (flag: string) => boolean) {
  if (mentions(question, ["lada", "utkast", "handstil", "kodicill", "drawer", "draft", "handwriting", "codicil"])) {
    if (marked("ne-admitted") || marked("ne-forge")) return edwardAdmitted;
    if (marked("nv-edward-hid")) return SAY.hidForHer;
    if (marked("nc-drawer-seen") || marked("nc-edward-knew")) return SAY.dismissalDraft;
  }
  if (mentions(question, ["biljett", "taget", "tagen", "london", "ticket", "train"])) {
    if (marked("ne-train")) return SAY.lastTrain;
    if (marked("scene-edward-ticket")) return SAY.morningTrain;
  }
  if (mentions(question, ["var var", "var befann", "alibi", "where were you"])) {
    if (marked("e-alibi")) return SAY.inRoom;
  }
  if (mentions(question, ["brevet", "arvode", "pengar", "letter", "fee", "money"])) {
    if (culprit === "edward" && marked("ne-denied")) return SAY.feeAgreed;
    if (culprit === "clara" && marked("nc-edward-knew")) return SAY.didNotWrite;
  }
  return flags.length > 0 ? VOICE.seen : VOICE.straight;
}

function claraVoice(question: string, flags: string[], marked: (flag: string) => boolean) {
  if (mentions(question, ["vem sag", "vem kom", "dorren", "who did you see", "doorway", "who came"])) {
    if (marked("c-saw-v")) return SAY.sawVictoria;
    if (marked("c-saw-e")) return SAY.sawEdward;
    if (marked("c-last")) return SAY.someoneDoor;
  }
  if (mentions(question, ["klockan", "uret", "visarna", "clock", "the hands"])) {
    if (marked("c-clock-intact")) return SAY.clockNine;
  }
  if (mentions(question, ["vin", "karaff", "kork", "wine", "decanter", "cork"])) {
    if (marked("nc-poured")) return claraPoured;
    if (marked("c-wine-fresh")) return SAY.wineNew;
    if (marked("nc-cork-early")) return claraEarly;
  }
  if (mentions(question, ["nar", "lamnade", "sist", "when did you", "last see", "leave"])) {
    if (marked("c-last")) return SAY.leftAlive;
  }
  if (mentions(question, ["victoria", "fonstret", "tio", "window", "ten"])) {
    if (marked("nc-slipped")) return SAY.cloth;
  }
  return flags.length > 0 ? VOICE.seen : VOICE.straight;
}

function thomasVoice(culprit: CulpritId, question: string, flags: string[], marked: (flag: string) => boolean) {
  if (mentions(question, ["lampa", "arbetsrum", "lamp", "study"])) {
    if (marked("nv-reed-slipped") || marked("ne-reed-slipped") || marked("nc-reed-slipped") || marked("scene-study-cold")) return SAY.lampOut;
  }
  if (mentions(question, ["var befann", "var var", "alibi", "where were you"])) {
    if (marked("t-alibi")) return SAY.inStudy;
  }
  if (mentions(question, ["brevet", "pengar", "huset", "letter", "money", "the house"])) {
    if (culprit === "victoria" && (marked("nv-reed-clear") || marked("t-alibi"))) return SAY.notMyLetter;
    if (culprit === "edward" && marked("ne-reed-clear")) return SAY.namesEdward;
    if (culprit === "clara" && marked("nc-reed-clear")) return SAY.aboutPost;
  }
  return flags.length > 0 ? VOICE.seen : VOICE.straight;
}
