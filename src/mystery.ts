import { tr } from "./locale";

export type ClueId = "clock" | "letter" | "glass";
export type SuspectId = "victoria" | "edward" | "clara" | "thomas";
export type VerdictTarget = SuspectId | "none";

export type InquiryState = {
  clues: ClueId[];
  flags: string[];
  used: string[];
};

export type Clue = {
  id: ClueId;
  name: string;
  desc: string;
  detail: string;
  icon: string;
};

export type Suspect = {
  id: SuspectId;
  name: string;
  role: string;
  detail: string;
  initials: string;
  image: string;
};

export type Choice = {
  id: string;
  suspectId: SuspectId;
  tag: string;
  label: string;
  outcome?: "open" | "shut";
  available: (state: InquiryState) => boolean;
  resolve: (state: InquiryState, name: string) => { answer: string; grants: string[] };
};

export type Verdict = {
  title: string;
  kicker: string;
  text: string;
  path: string;
};

export const CLUES: Clue[] = [
  {
    id: "clock",
    name: "Det trasiga uret",
    desc: "Hittades bredvid skrivbordet.",
    detail:
      "Glaset är slaget ut från urtavlan, och visarna är böjda till exakt 22:15. En klocka som stannar av sig själv ser inte ut så här. Någon har ställt tiden.",
    icon: "◷",
  },
  {
    id: "letter",
    name: "Det förseglade brevet",
    desc: "Ett brev med brutet sigill.",
    detail:
      "Sigillet är brutet. Texten är kort: ”Edward — siffrorna stämmer inte. Reed har flyttat pengar sedan mars. Jag konfronterar honom i kväll.”",
    icon: "✉",
  },
  {
    id: "glass",
    name: "Vinglaset",
    desc: "Ett glas står kvar på bordet.",
    detail:
      "Ett enda glas, med en besk hinna i botten. På foten sitter ett färskt bläckstreck, som från en hand som just hållit en penna.",
    icon: "◇",
  },
];

export const SUSPECTS: Suspect[] = [
  {
    id: "victoria",
    name: "Victoria Blackwood",
    role: "Herrgårdens ägare",
    detail: "Hade en konflikt med offret samma kväll.",
    initials: "VB",
    image: "/suspects/victoria.jpg",
  },
  {
    id: "edward",
    name: "Edward Hayes",
    role: "Familjens advokat",
    detail: "Ett viktigt dokument har försvunnit.",
    initials: "EH",
    image: "/suspects/edward.jpg",
  },
  {
    id: "clara",
    name: "Clara Whitmore",
    role: "Hushållerskan",
    detail: "Var den sista som såg offret vid liv.",
    initials: "CW",
    image: "/suspects/clara.jpg",
  },
  {
    id: "thomas",
    name: "Thomas Reed",
    role: "Affärspartner",
    detail: "Offret hade upptäckt ekonomiska oegentligheter.",
    initials: "TR",
    image: "/suspects/thomas.jpg",
  },
];

const NOTES: { flag: string; title: string; text: string }[] = [
  { flag: "v-alibi", title: "Victoria", text: "Säger att hon var i trädgården efter grälet." },
  { flag: "v-will", title: "Testamentet", text: "Grälet gällde Alistairs vilja att skriva om arvet." },
  { flag: "v-heard-glass", title: "Glas efter halv tio", text: "Victoria hörde glas krossas från biblioteket, redan ute på terrassen." },
  { flag: "v-named-reed", title: "Reeds namn", text: "Alistair skulle tala med Edward om Reed innan kvällen var slut." },
  { flag: "v-hostile", title: "Victoria tiger", text: "Hon hjälper inte längre. Anklagelsen stängde henne." },
  { flag: "v-heard-something", title: "Otydligt ljud", text: "Victoria hörde något som kan ha varit glas, men säger inte när." },
  { flag: "e-alibi", title: "Edward", text: "Säger att han var på sitt rum med papper." },
  { flag: "e-evasive", title: "Kodicillen", text: "Ett tillägg till testamentet är undanlagt. Han vill inte säga varför." },
  { flag: "e-hid-codicil", title: "Gömt testamente", text: "Edward gömde kodicillen av rädsla för Thomas." },
  { flag: "e-deal", title: "Edwards byte", text: "Han berättar mer mot att det stannar mellan er." },
  { flag: "e-reed-asked", title: "Frågan vid middagen", text: "Reed frågade efter kodicillen redan vid bordet." },
  { flag: "e-motive", title: "Arvet", text: "Alistair tänkte ta Reed ur testamentet." },
  { flag: "e-defensive", title: "Edward sluter sig", text: "Anklagelsen fick honom att sluta hjälpa." },
  { flag: "c-last", title: "Kvart i tio", text: "Clara lämnade Alistair levande. Han skrev." },
  { flag: "c-saw-reed", title: "Reed i dörren", text: "Thomas kom in i biblioteket när Clara gick ut." },
  { flag: "c-clock-intact", title: "Uret vid nio", text: "Clara drog upp uret klockan nio. Glaset var helt." },
  { flag: "c-wine-fresh", title: "Ny karaff", text: "Clara korkade upp vinet själv. Bara den som blev kvar kunde röra glaset." },
  { flag: "c-offended", title: "Clara misstrodd", text: "Hon ger inget mer frivilligt." },
  { flag: "c-cork-shown", title: "Korken visad", text: "Clara har sett att ni hittade korken i köket." },
  { flag: "scene-study-cold", title: "Kall lampa", text: "Arbetsrummets lampa är kall och läskpappret torrt. Ingen skrev där den senaste timmen." },
  { flag: "scene-kitchen-cork", title: "Korken i köket", text: "En nyskuren kork ligger på skärbrädan. Karaffen är borta." },
  { flag: "scene-codicil", title: "Kodicillen", text: "I Edwards låda ligger tillägget som stryker Reed ur testamentet." },
  { flag: "scene-edward-ticket", title: "Biljetten", text: "I Edwards väska ligger en biljett för första tåget mot London i morgon bitti." },
  { flag: "e-ticket-shown", title: "Resan", text: "Edward säger att biljetten var en resa bort, inte ett skäl att stanna." },
  { flag: "scene-shawl", title: "Sjalen", text: "En varm sjal ligger på terrassen, med uppsikt mot biblioteksfönstret." },
  { flag: "scene-terrace-prints", title: "Fotspåren", text: "Spåren på terrassen slutar vid bänken. Inget vänder tillbaka mot dörren." },
  { flag: "v-prints-shown", title: "Victoria om spåren", text: "Hon säger att spåren är hennes och att hon inte gick in igen." },
  { flag: "scene-reed-glass", title: "Orört glas", text: "Reeds glas i matsalen är fullt. Bara Alistairs glas lämnade bordet." },
  { flag: "scene-dining-left", title: "Stolen", text: "Alistairs stol är vänd mot biblioteket. Han gick dit och satte sig inte igen." },
  { flag: "c-left-shown", title: "Clara om stolen", text: "Clara säger att han reste sig från bordet för att skriva." },
  { flag: "scene-kitchen-gap", title: "Dammet", text: "Ringen i dammet på hyllan visar att karaffen togs därifrån i kväll." },
  { flag: "scene-study-book", title: "Oöppnad bok", text: "Räkenskapsboken i arbetsrummet har inte använts i kväll." },
  { flag: "t-book-closed", title: "Reed om boken", text: "Thomas säger att han inte slog upp räkenskapsboken igen efter klockan tio." },
  { flag: "t-study-cold", title: "Reed om lampan", text: "Thomas säger att han släckte i arbetsrummet. Rummet ser inte ut att ha använts." },
  { flag: "e-found-shown", title: "Lådan", text: "Edward vet att ni hittade kodicillen." },
  { flag: "t-alibi", title: "Reeds alibi", text: "Thomas säger att han satt i arbetsrummet från klockan tio." },
  { flag: "t-bluff-failed", title: "Bluffen sprack", text: "Du påstod ett vittne du inte hade. Reed genomskådade det." },
  { flag: "t-wary", title: "Reed är på sin vakt", text: "Han litar inte på dina frågor efter bluffen." },
  { flag: "t-admits-library", title: "Han var där", text: "Thomas medger att han gick in i biblioteket." },
  { flag: "t-admits-money", title: "Pengarna", text: "Thomas erkänner att han flyttade pengar från kontona." },
  { flag: "t-clock-slip", title: "Lögnen om uret", text: "Thomas säger att klockan gick fel. Clara säger att den gick rätt." },
  { flag: "t-clock-deflected", title: "Uret avfärdat", text: "Utan Claras tidsuppgift kallar Thomas den krossade klockan en olycka." },
  { flag: "t-confessed", title: "Erkännande", text: "Thomas Reed har erkänt att han förgiftade glaset och ställde om uret." },
  { flag: "t-partial", title: "Halvt erkännande", text: "Han medger stöld och klocka, men nekar giftet." },
];

function has(state: InquiryState, flag: string) {
  return state.flags.includes(flag);
}

function clue(state: InquiryState, id: ClueId) {
  return state.clues.includes(id);
}

function fresh(state: InquiryState, id: string) {
  return !state.used.includes(id);
}

function allClues(state: InquiryState) {
  return CLUES.every((item) => state.clues.includes(item.id));
}

function wineProof(state: InquiryState) {
  return has(state, "c-wine-fresh") || has(state, "scene-kitchen-cork");
}

export function address(name: string) {
  const trimmed = name.trim();
  if (!trimmed || trimmed.toLowerCase() === "du") return "utredare";
  return trimmed;
}

export function notesFor(state: InquiryState) {
  return NOTES.filter((note) => state.flags.includes(note.flag));
}

export type Mood = "öppen" | "vaksam" | "tyst";

export function suspectMood(id: SuspectId, state: InquiryState): Mood | null {
  if (id === "victoria") {
    if (has(state, "v-hostile")) return "tyst";
    if (has(state, "v-tone")) return "öppen";
    if (has(state, "v-alibi") || has(state, "v-will")) return "vaksam";
    return null;
  }
  if (id === "edward") {
    if (has(state, "e-defensive")) return "tyst";
    if (has(state, "e-tone")) return "öppen";
    if (has(state, "e-alibi") || has(state, "e-evasive")) return "vaksam";
    return null;
  }
  if (id === "clara") {
    if (has(state, "c-offended")) return "tyst";
    if (has(state, "c-tone")) return "öppen";
    if (has(state, "c-last")) return "vaksam";
    return null;
  }
  if (has(state, "t-confessed")) return "öppen";
  if (has(state, "t-wary") || has(state, "t-partial") || has(state, "t-alibi")) return "vaksam";
  return null;
}

export type TimelineSlot = {
  id: string;
  time: string;
  lines: string[];
};

export function eveningTimeline(state: InquiryState): TimelineSlot[] {
  const dinner: string[] = [];
  if (has(state, "v-will")) dinner.push("Victoria och Alistair grälar om testamentet.");
  else if (has(state, "v-alibi")) dinner.push("Victoria går ut efter ett gräl.");
  if (has(state, "e-reed-asked")) dinner.push("Reed frågar efter kodicillen vid bordet.");
  if (has(state, "scene-reed-glass")) dinner.push("Bara Alistairs glas lämnar matsalen.");
  if (has(state, "scene-dining-left") || has(state, "c-left-shown")) {
    dinner.push("Alistair reser sig mot biblioteket.");
  }

  const nine: string[] = [];
  if (has(state, "c-clock-intact")) nine.push("Clara drar upp uret. Det visar rätt tid.");

  const half: string[] = [];
  if (has(state, "v-heard-glass")) half.push("Victoria hör glas krossas. Hon är redan ute.");
  else if (has(state, "v-heard-something")) half.push("Victoria hör något, men säger inte när.");

  const quarter: string[] = [];
  if (has(state, "c-saw-reed") && has(state, "c-last")) {
    quarter.push("Clara lämnar honom levande. Reed går in.");
  } else if (has(state, "c-last")) {
    quarter.push("Clara lämnar Alistair levande.");
  }
  if (has(state, "c-wine-fresh") || has(state, "scene-kitchen-cork")) {
    quarter.push("Karaffen var nyöppnad.");
  } else if (has(state, "scene-kitchen-gap")) {
    quarter.push("Karaffen togs från hyllan i kväll.");
  }

  const ten: string[] = [];
  if (has(state, "t-admits-library")) ten.push("Thomas medger att han var i biblioteket.");
  else if (has(state, "t-alibi")) ten.push("Thomas säger att han sitter i arbetsrummet.");
  if (has(state, "scene-study-cold") || has(state, "t-study-cold")) {
    ten.push("Lampan i arbetsrummet är kall.");
  } else if (has(state, "scene-study-book") || has(state, "t-book-closed")) {
    ten.push("Räkenskapsboken är oöppnad.");
  }

  const death: string[] = [];
  if (clue(state, "clock")) death.push("Visarna är böjda till 22:15.");
  if (has(state, "t-clock-slip")) death.push("Thomas och Clara säger olika saker om uret.");

  return [
    { id: "table", time: "Bordet", lines: dinner.slice(0, 2) },
    { id: "nine", time: "21:00", lines: nine.slice(0, 2) },
    { id: "half", time: "21:30", lines: half.slice(0, 2) },
    { id: "quarter", time: "21:45", lines: quarter.slice(0, 2) },
    { id: "ten", time: "22:00", lines: ten.slice(0, 2) },
    { id: "death", time: "22:15", lines: death.slice(0, 2) },
  ].map((slot) => ({ ...slot, time: tr(slot.time), lines: slot.lines.map(tr) }));
}

export function timelineClashes(state: InquiryState) {
  const lines: string[] = [];
  if (has(state, "v-heard-glass") && clue(state, "clock")) {
    lines.push("21:30 och 22:15 går inte ihop.");
  }
  if (has(state, "t-alibi") && (has(state, "scene-study-cold") || has(state, "t-study-cold"))) {
    lines.push("Klockan tio och arbetsrummet går inte ihop.");
  }
  return lines.map(tr);
}

export function pathSummary(state: InquiryState) {
  const parts: string[] = [];
  if (has(state, "t-wary")) parts.push("Du bluffade Reed, och han genomskådade det");
  if (has(state, "scene-kitchen-cork") && has(state, "c-wine-fresh")) {
    parts.push("Korken i köket och Clara sa samma sak om karaffen");
  } else if (has(state, "c-wine-fresh")) parts.push("Clara litade på dig och berättade om karaffen");
  else if (has(state, "scene-kitchen-cork")) parts.push("Du hittade den nyskurna korken i köket");
  else if (has(state, "c-offended")) parts.push("Clara slöt sig när du misstänkte henne");
  if (has(state, "scene-codicil")) parts.push("Du öppnade lådan i Edwards rum");
  if (has(state, "scene-edward-ticket")) parts.push("Du hittade morgonens biljett i Edwards väska");
  if (has(state, "scene-study-cold")) parts.push("Lampan i arbetsrummet var kall");
  if (has(state, "scene-study-book")) parts.push("Räkenskapsboken i arbetsrummet var oöppnad");
  if (has(state, "scene-dining-left")) parts.push("Alistairs stol var vänd mot biblioteket");
  if (has(state, "scene-kitchen-gap")) parts.push("Dammet visade att karaffen togs i kväll");
  if (has(state, "scene-terrace-prints")) parts.push("Fotspåren på terrassen slutade vid bänken");
  if (has(state, "v-hostile")) parts.push("Victoria vägrade hjälpa efter din anklagelse");
  else if (has(state, "v-heard-glass")) parts.push("Victoria berättade om glaset hon hörde");
  if (has(state, "e-deal")) parts.push("Edward bytte kodicillen mot din diskretion");
  else if (has(state, "e-hid-codicil")) parts.push("Edward erkände att han gömde testamentet");
  else if (has(state, "e-defensive")) parts.push("Edward stängde sig när du anklagade honom");
  if (has(state, "t-confessed")) parts.push("Reed erkände när kedjan var hel");
  else if (has(state, "t-partial")) parts.push("Reed erkände stöld och klocka, men inte giftet");
  if (parts.length === 0) return tr("Du rörde knappt vid förhören. Fallet förblev en yta.");
  return `${parts.map((part) => tr(part)).join(". ")}.`;
}

export const CHOICES: Choice[] = [
  {
    id: "v-where",
    suspectId: "victoria",
    tag: "ÖPPNING",
    label: "Var befann du dig när din bror dog?",
    available: (state) => fresh(state, "v-where"),
    resolve: (_state, name) => ({
      grants: ["v-alibi"],
      answer: `I trädgården, ${address(name)}. Vi hade grälat, och jag behövde luft innan jag sa något jag inte kunde ta tillbaka. När skriket kom stod jag redan på terrassen.`,
    }),
  },
  {
    id: "v-argument",
    suspectId: "victoria",
    tag: "FÖLJ FRÅGAN",
    label: "Vad handlade grälet om?",
    available: (state) => fresh(state, "v-argument") && has(state, "v-alibi"),
    resolve: () => ({
      grants: ["v-will"],
      answer:
        "Testamentet. Alistair ville skriva om det, som om huset bara var hans att ge bort. Jag sa att han inte fick skänka vår historia till en affärspartner. Sedan gick jag.",
    }),
  },
  {
    id: "v-gentle",
    suspectId: "victoria",
    tag: "LUGN TON",
    outcome: "open",
    label: "Jag tror inte att du dödade honom. Berätta vad du hörde.",
    available: (state) => fresh(state, "v-gentle") && has(state, "v-will") && !has(state, "v-tone"),
    resolve: (_state, name) => ({
      grants: ["v-tone", "v-heard-glass", "v-named-reed"],
      answer: `Då ska du få det jag vet, ${address(name)}. Jag hörde glas krossas strax efter halv tio, från biblioteket. Jag var redan ute. Det sista Alistair sa var att han skulle tala med Edward om Reed innan kvällen var slut.`,
    }),
  },
  {
    id: "v-accuse",
    suspectId: "victoria",
    tag: "ANKLAGA",
    outcome: "shut",
    label: "Du grälade med honom. Det räcker för mig.",
    available: (state) => fresh(state, "v-accuse") && has(state, "v-will") && !has(state, "v-tone"),
    resolve: () => ({
      grants: ["v-tone", "v-hostile"],
      answer:
        "Hur vågar du. Jag lämnade honom levande, med bläck på fingrarna och ilska i rösten. Om du redan fällt domen är det här samtalet slut.",
    }),
  },
  {
    id: "v-letter",
    suspectId: "victoria",
    tag: "BEVIS · BREVET",
    label: "Brevet nämner Reed. Inte dig.",
    available: (state) => fresh(state, "v-letter") && clue(state, "letter"),
    resolve: (state) => ({
      grants: ["v-letter-shown"],
      answer: has(state, "v-hostile")
        ? "Läs det själv, då. Reed. Inte jag. Och nej — jag tänker inte hjälpa dig mer bara för att papperet har rätt."
        : "Då ser du det. Min ilska gällde arvet. Pengarna var Reeds skugga, inte min. Jag skulle aldrig förgifta min bror för ett hus jag redan bor i.",
    }),
  },
  {
    id: "v-clock",
    suspectId: "victoria",
    tag: "BEVIS · URET",
    label: "Uret är krossat. Hörde du det?",
    available: (state) => fresh(state, "v-clock") && clue(state, "clock"),
    resolve: (state) =>
      has(state, "v-heard-glass")
        ? {
            grants: ["v-clock-shown"],
            answer:
              "Det är det jag redan sagt. Strax efter halv tio, från biblioteket. Jag stod på terrassen och rörde inte uret. Någon annan slog sönder det.",
          }
        : has(state, "v-hostile")
          ? {
              grants: ["v-clock-shown", "v-heard-something"],
              answer: "Glas, ja. Mer får du inte. Jag var i trädgården, och jag tänker inte klä din anklagelse med detaljer.",
            }
          : {
              grants: ["v-clock-shown", "v-heard-something"],
              answer:
                "Jag hörde något som kan ha varit glas. Jag såg inte vem, och jag såg inte på klockan. Du får tiden bara om du frågar mig som ett vittne, inte som en misstänkt.",
            },
  },
  {
    id: "v-prints",
    suspectId: "victoria",
    tag: "TERRASSEN",
    label: "Fotspåren slutar vid bänken. Du gick inte tillbaka in.",
    available: (state) => fresh(state, "v-prints") && has(state, "v-alibi") && has(state, "scene-terrace-prints"),
    resolve: (state) =>
      has(state, "v-hostile")
        ? {
            grants: ["v-prints-shown"],
            answer: "Spåren säger det jag redan sagt. Jag stannade ute. Mer får du inte.",
          }
        : {
            grants: ["v-prints-shown"],
            answer:
              "De är mina. Jag gick till bänken och stannade. Ingen stig går tillbaka mot dörren, för jag gick inte in igen.",
          },
  },
  {
    id: "e-where",
    suspectId: "edward",
    tag: "ÖPPNING",
    label: "Var var du när han dog?",
    available: (state) => fresh(state, "e-where"),
    resolve: () => ({
      grants: ["e-alibi"],
      answer:
        "På mitt rum. Jag gick igenom papper. En advokats alibi är sällan vackert, men jag var inte i biblioteket.",
    }),
  },
  {
    id: "e-missing",
    suspectId: "edward",
    tag: "FÖLJ FRÅGAN",
    label: "Vilket dokument är det som saknas?",
    available: (state) => fresh(state, "e-missing") && has(state, "e-alibi"),
    resolve: () => ({
      grants: ["e-evasive"],
      answer:
        "Ett tillägg till testamentet. En kodicill. Jag lade den åt sidan. Mer än så tänker jag inte säga förrän jag vet hur du tänker använda det.",
    }),
  },
  {
    id: "e-pressure",
    suspectId: "edward",
    tag: "PRESSA",
    outcome: "open",
    label: "Du döljer något. Säg det rakt.",
    available: (state) => fresh(state, "e-pressure") && has(state, "e-evasive") && !has(state, "e-tone"),
    resolve: () => ({
      grants: ["e-tone", "e-hid-codicil", "e-motive"],
      answer:
        "Jag gömde kodicillen. Thomas skulle ha förstört den, och jag var för rädd för att säga emot honom vid bordet. Alistair tänkte ta bort Reed som förmånstagare. Det gör mig feg. Det gör mig inte skyldig.",
    }),
  },
  {
    id: "e-deal",
    suspectId: "edward",
    tag: "FÖRHANDLA",
    outcome: "open",
    label: "Berätta om dokumentet, så stannar det mellan oss.",
    available: (state) => fresh(state, "e-deal") && has(state, "e-evasive") && !has(state, "e-tone"),
    resolve: (_state, name) => ({
      grants: ["e-tone", "e-deal", "e-motive", "e-reed-asked"],
      answer: `Då säger jag det en gång, ${address(name)}. Reed frågade efter kodicillen redan vid middagen. Han visste att jag hade utkastet. Alistair skulle lyfta ur honom ur testamentet och lägga kapitalet i en stiftelse. Jag gömde papperet så att Reed inte skulle bränna det. Jag är en fegis. Jag är inte en mördare.`,
    }),
  },
  {
    id: "e-accuse",
    suspectId: "edward",
    tag: "ANKLAGA",
    outcome: "shut",
    label: "Du dödade honom för dokumentets skull.",
    available: (state) => fresh(state, "e-accuse") && has(state, "e-evasive") && !has(state, "e-tone"),
    resolve: () => ({
      grants: ["e-tone", "e-defensive"],
      answer:
        "Absurt. Jag hade redan papperet i skrivbordet. En död klient är det sista en advokat vill ha, och jag tänker inte klä din teori med fler detaljer.",
    }),
  },
  {
    id: "e-letter",
    suspectId: "edward",
    tag: "BEVIS · BREVET",
    label: "Alistair skrev till dig om Reed och pengarna.",
    available: (state) => fresh(state, "e-letter") && clue(state, "letter"),
    resolve: (state) => {
      if (has(state, "e-defensive")) {
        return {
          grants: ["e-letter-shown"],
          answer: "Jag känner igen hans handstil. Det är allt ni får av någon som redan pekat på mig.",
        };
      }
      if (has(state, "e-motive")) {
        return {
          grants: ["e-letter-shown", "e-motive"],
          answer:
            "Ja. Det är samma sak han skrev till mig i veckan. Jag svarade inte. Det är min skuld, inte mitt brott. Reed visste att kvällen skulle kosta honom arvet.",
        };
      }
      return {
        grants: ["e-letter-shown", "e-motive"],
        answer:
          "Jag fick ett liknande utkast tidigare i veckan och svarade inte. Det ångrar jag. Brevet säger vad Alistair tänkte göra med Reed. Det säger inte att jag höll i glaset.",
      };
    },
  },
  {
    id: "e-found",
    suspectId: "edward",
    tag: "EDWARDS RUM",
    label: "Kodicillen låg i din låda. Reed är struken ur testamentet.",
    available: (state) => fresh(state, "e-found") && has(state, "scene-codicil"),
    resolve: (state) => {
      if (has(state, "e-defensive")) {
        return {
          grants: ["e-found-shown"],
          answer: "Ni har rotat i mitt rum. Ja, det är kodicillen. Mer säger jag inte till någon som redan fällt mig.",
        };
      }
      if (has(state, "e-motive")) {
        return {
          grants: ["e-found-shown"],
          answer: "Då har ni sett den själva. Jag gömde den för Reed, inte för er. Papperet säger vad jag redan sagt.",
        };
      }
      return {
        grants: ["e-tone", "e-hid-codicil", "e-motive", "e-reed-asked", "e-found-shown"],
        answer:
          "Ni hittade den. Jag lade den under kuvertet efter middagen, när Reed hade frågat efter utkastet. Alistair skulle stryka honom. Jag är en fegis. Jag är inte mördaren.",
      };
    },
  },
  {
    id: "e-ticket",
    suspectId: "edward",
    tag: "EDWARDS RUM",
    label: "Det ligger en biljett i väskan. Första tåget mot London.",
    available: (state) => fresh(state, "e-ticket") && has(state, "scene-edward-ticket"),
    resolve: (state) =>
      has(state, "e-defensive")
        ? {
            grants: ["e-ticket-shown"],
            answer: "En biljett. Ja. Jag tänker inte förklara min resa för någon som redan fällt mig.",
          }
        : {
            grants: ["e-ticket-shown"],
            answer:
              "Första tåget mot London. Jag lade den i väskan innan kvällen var slut. Jag tänkte vara borta innan huset vaknade. Det är en resa bort från det här, inte ett skäl att stanna i biblioteket.",
          },
  },
  {
    id: "c-last",
    suspectId: "clara",
    tag: "ÖPPNING",
    label: "Du såg honom sist. Vad gjorde han?",
    available: (state) => fresh(state, "c-last"),
    resolve: () => ({
      grants: ["c-last"],
      answer:
        "Jag kom med karaffen kvart i tio. Han levde och skrev. Han bad mig gå, så jag gick. När jag kom tillbaka senare låg han vid skrivbordet.",
    }),
  },
  {
    id: "c-who",
    suspectId: "clara",
    tag: "FÖLJ FRÅGAN",
    label: "Vem mer var i biblioteket?",
    available: (state) => fresh(state, "c-who") && has(state, "c-last"),
    resolve: () => ({
      grants: ["c-saw-reed"],
      answer:
        "Herr Reed kom in när jag gick ut. Han sa att de hade papper att skriva under. Jag lämnade dem där. Hans lordskap nickade bara, som om besöket var väntat.",
    }),
  },
  {
    id: "c-clock",
    suspectId: "clara",
    tag: "BEVIS · URET",
    label: "Uret är krossat och står på 22:15. Hur såg det ut tidigare?",
    available: (state) => fresh(state, "c-clock") && has(state, "c-last") && clue(state, "clock"),
    resolve: () => ({
      grants: ["c-clock-intact"],
      answer:
        "Jag drog upp det själv vid nio. Glaset var helt, och det visade rätt tid. Den som påstår att uret gick fel redan vid middagen ljuger.",
    }),
  },
  {
    id: "c-trust",
    suspectId: "clara",
    tag: "LUGN TON",
    outcome: "open",
    label: "Tack. Du är vårt säkraste vittne. Finns det mer?",
    available: (state) => fresh(state, "c-trust") && has(state, "c-saw-reed") && !has(state, "c-tone"),
    resolve: (_state, name) => ({
      grants: ["c-tone", "c-wine-fresh"],
      answer: `Vinet var nytt, ${address(name)}. Jag korkade upp flaskan i köket och hällde upp karaffen själv. Ingen annan rörde den innan jag bar in den. Bara den som blev kvar i rummet kan ha lagt något i hans glas.`,
    }),
  },
  {
    id: "c-doubt",
    suspectId: "clara",
    tag: "MISSTRO",
    outcome: "shut",
    label: "Du hade tillfälle. Varför skulle vi tro dig?",
    available: (state) => fresh(state, "c-doubt") && has(state, "c-saw-reed") && !has(state, "c-tone"),
    resolve: () => ({
      grants: ["c-tone", "c-offended"],
      answer:
        "Jag har tjänat det här huset i tjugo år, och jag ärver inte en penny. Fråga Victoria om min lön om ni måste. Mer frivilligt får ni inte av någon som redan ser en mördare i förklädet.",
    }),
  },
  {
    id: "c-cork",
    suspectId: "clara",
    tag: "KÖKET",
    label: "Korken i köket är nyskuren. Karaffen kom därifrån i kväll.",
    available: (state) =>
      fresh(state, "c-cork") && has(state, "scene-kitchen-cork") && has(state, "c-last") && !has(state, "c-wine-fresh"),
    resolve: (state) =>
      has(state, "c-offended")
        ? {
            grants: ["c-cork-shown"],
            answer:
              "Då har ni sett köket själva. Jag skar den. Jag tänker inte tacka er för att ni rotade, efter att ha kallat mig mördare.",
          }
        : {
            grants: ["c-tone", "c-wine-fresh", "c-cork-shown"],
            answer:
              "Ja. Jag skar den själv, i köket, och bar in karaffen. Ingen rörde den på vägen. Bara den som blev kvar hos honom kan ha rört glaset.",
          },
  },
  {
    id: "c-left",
    suspectId: "clara",
    tag: "MATSALEN",
    label: "Alistairs stol är vänd mot biblioteket. Han gick direkt dit.",
    available: (state) => fresh(state, "c-left") && has(state, "c-last") && has(state, "scene-dining-left"),
    resolve: (state) =>
      has(state, "c-offended")
        ? {
            grants: ["c-left-shown"],
            answer: "Han reste sig och gick. Det såg ni själva. Jag dukar inte av en stol för att ni redan misstror mig.",
          }
        : {
            grants: ["c-left-shown"],
            answer:
              "Ja. Han sköt ut stolen mot dörren och gick för att skriva. Han satte sig inte tillbaka. Det var det sista jag såg av honom vid bordet.",
          },
  },
  {
    id: "c-shelf",
    suspectId: "clara",
    tag: "KÖKET",
    label: "Dammet på hyllan är brutet. Karaffen togs därifrån i kväll.",
    available: (state) =>
      fresh(state, "c-shelf") && has(state, "scene-kitchen-gap") && has(state, "c-last") && !has(state, "c-wine-fresh"),
    resolve: (state) =>
      has(state, "c-offended")
        ? {
            grants: ["c-cork-shown"],
            answer: "Då har ni sett hyllan. Jag tog den i kväll. Jag tänker inte utveckla det efter att ha blivit kallad mördare.",
          }
        : {
            grants: ["c-tone", "c-wine-fresh", "c-cork-shown"],
            answer:
              "Ja. Jag lyfte den själv i kväll och bar in den. Ingen rörde den på vägen. Bara den som blev kvar hos honom kan ha rört glaset.",
          },
  },
  {
    id: "t-where",
    suspectId: "thomas",
    tag: "ÖPPNING",
    label: "Var befann du dig vid elvatiden?",
    available: (state) => fresh(state, "t-where"),
    resolve: () => ({
      grants: ["t-alibi"],
      answer:
        "I arbetsrummet, från tio tills skriket. Jag hörde Clara och kom springande. Den som säger något annat har bråttom att peka.",
    }),
  },
  {
    id: "t-study",
    suspectId: "thomas",
    tag: "ARBETSRUMMET",
    label: "Lampan i arbetsrummet är kall. Läskpappret är torrt.",
    available: (state) => fresh(state, "t-study") && has(state, "t-alibi") && has(state, "scene-study-cold"),
    resolve: (state) => ({
      grants: ["t-study-cold"],
      answer: has(state, "t-admits-library")
        ? "Ja. Jag släckte när jag gick därifrån, och jag gick till biblioteket. Lampan bevisar att jag inte stannade. Den bevisar inte vad som hände sedan."
        : "Jag släckte när jag hörde skriket. Papper torkar fort. En kall lampa river inget alibi.",
    }),
  },
  {
    id: "t-ledger",
    suspectId: "thomas",
    tag: "ARBETSRUMMET",
    label: "Räkenskapsboken är oöppnad. Du satt inte och skrev.",
    available: (state) => fresh(state, "t-ledger") && has(state, "t-alibi") && has(state, "scene-study-book"),
    resolve: (state) => ({
      grants: ["t-book-closed"],
      answer: has(state, "t-admits-library")
        ? "Boken låg kvar. Jag öppnade den inte, för jag var inte kvar. Jag gick till biblioteket."
        : has(state, "t-wary")
          ? "En stängd bok bevisar inte var en man satt. Jag tänker inte fylla i resten åt er."
          : "Jag hade den framme. Jag slog inte upp den igen efter tio. En stängd bok är inget alibi, och inget brott.",
    }),
  },
  {
    id: "t-bluff",
    suspectId: "thomas",
    tag: "BLUFF",
    label: "Vi har redan ett vittne som såg dig i biblioteket.",
    available: (state) =>
      fresh(state, "t-bluff") && has(state, "t-alibi") && !has(state, "c-saw-reed") && !has(state, "t-admits-library"),
    resolve: () => ({
      grants: ["t-bluff-failed", "t-wary"],
      answer:
        "Då får vittnet träda fram med namn. Jag var i arbetsrummet. Den som påstår annat ljuger, och jag tänker inte belöna en påhittad historia med en bekännelse.",
    }),
  },
  {
    id: "t-clara",
    suspectId: "thomas",
    tag: "MOTSÄGELSE",
    label: "Clara såg dig gå in när hon gick ut.",
    available: (state) => fresh(state, "t-clara") && has(state, "t-alibi") && has(state, "c-saw-reed"),
    resolve: (state) => ({
      grants: ["t-admits-library"],
      answer: has(state, "t-bluff-failed")
        ? "Så hushållerskan är ert vittne. Inte ett påhitt. Ja — jag gick in när hon gick ut. Några ord om papper. Sedan gick jag. Nöjda, eller ska ni ljuga en gång till?"
        : has(state, "t-study-cold")
          ? "Arbetsrummet höll inte. Lampan var kall, det såg ni själva. Ja — jag gick in när Clara gick ut. Några ord om papper. Jag stannade inte."
          : "Clara överdriver tidpunkten, men ja. Jag stack in huvudet. Vi skulle skriva under papper. Jag stannade inte, och jag satte mig inte.",
    }),
  },
  {
    id: "t-victoria",
    suspectId: "thomas",
    tag: "VITTNE",
    label: "Victoria säger att Alistair skulle konfrontera dig i kväll.",
    available: (state) => fresh(state, "t-victoria") && has(state, "t-alibi") && has(state, "v-named-reed"),
    resolve: (state) => ({
      grants: ["t-heard-victoria"],
      answer: has(state, "t-admits-money")
        ? "Då visste hon mer än hon sa vid middagen. Ja. Han tänkte göra det i biblioteket. Det är fortfarande inte ett giftmord."
        : has(state, "t-wary")
          ? "Victoria vill rädda sig själv. Jag har inget att lägga till åt någon som redan ljugit för mig."
          : "Systern hörde ett gräl och gör om det till en anklagelse. Alistair och jag talades vid om affärer. Inget mer.",
    }),
  },
  {
    id: "t-dinner",
    suspectId: "thomas",
    tag: "VITTNE",
    label: "Edward säger att du frågade efter kodicillen vid middagen.",
    available: (state) => fresh(state, "t-dinner") && has(state, "t-alibi") && has(state, "e-reed-asked"),
    resolve: (state) => ({
      grants: has(state, "t-admits-money") ? ["t-heard-dinner"] : ["t-heard-dinner", "t-dinner-crack"],
      answer: has(state, "t-admits-money")
        ? "Ja. Jag ville veta om Alistair redan hade skrivit under. Det hade han inte. Hayes pratar för mycket, men den delen stämmer."
        : has(state, "t-wary")
          ? "Hayes säljer mig för att rädda sig själv. Jag kan ha nämnt papper. Det gör mig inte till mördare, och jag tänker inte utveckla det för dig."
          : "Hayes pratar för mycket. Jag frågade av artighet var utkastet låg. En man får väl fråga efter ett avtal som rör hans eget namn.",
    }),
  },
  {
    id: "t-soft",
    suspectId: "thomas",
    tag: "LUGN TON",
    outcome: "open",
    label: "Berätta om pengarna. Mordfrågan kan vänta.",
    available: (state) =>
      fresh(state, "t-soft") &&
      has(state, "t-admits-library") &&
      !has(state, "t-wary") &&
      !has(state, "t-admits-money") &&
      (clue(state, "letter") || has(state, "e-motive")),
    resolve: (state) => {
      if (has(state, "e-reed-asked")) {
        return {
          grants: ["t-admits-money"],
          answer:
            "Hayes har pratat, ser jag. Ja, jag frågade efter kodicillen. Och ja — jag flyttade pengar mellan våra bolag. Jag tänkte lägga tillbaka dem innan Alistair gjorde det omöjligt. Siffrorna erkänner jag. Giftet gör jag inte.",
        };
      }
      if (has(state, "e-motive")) {
        return {
          grants: ["t-admits-money"],
          answer:
            "Så advokaten förrådde tystnadsplikten. Pengarna stämmer. Jag lånade mot kapital jag ändå skulle ärva. Mordet tänker jag inte ta på mig för att ni ber snällt.",
        };
      }
      return {
        grants: ["t-admits-money"],
        answer:
          "Jag flyttade belopp. Kalla det ett lån, tills han bestämde sig för att kalla det stöld. Jag erkänner siffrorna. Jag erkänner inte ett glas.",
      };
    },
  },
  {
    id: "t-letter-hard",
    suspectId: "thomas",
    tag: "BEVIS · BREVET",
    label: "Brevet är hans handstil. Pengar sedan mars. Förklara det.",
    available: (state) =>
      fresh(state, "t-letter-hard") &&
      clue(state, "letter") &&
      has(state, "t-wary") &&
      has(state, "t-admits-library") &&
      !has(state, "t-admits-money"),
    resolve: () => ({
      grants: ["t-admits-money"],
      answer:
        "…Han skrev det alltså. Ja. Pengarna. Jag tänkte inte bekänna förskingring för någon som bluffade, men papperet ljuger inte. Mordet får ni fortfarande bevisa.",
    }),
  },
  {
    id: "t-motive-hard",
    suspectId: "thomas",
    tag: "VITTNE",
    label: "Edward säger att Alistair skulle ta dig ur testamentet.",
    available: (state) =>
      fresh(state, "t-motive-hard") &&
      has(state, "t-wary") &&
      has(state, "t-admits-library") &&
      has(state, "e-motive") &&
      !clue(state, "letter") &&
      !has(state, "t-admits-money"),
    resolve: () => ({
      grants: ["t-admits-money"],
      answer:
        "Hayes igen. Ja. Arvet skulle försvinna, och pengarna jag redan flyttat skulle synas i dagsljus. Det är förskingring. Mord får ni fortfarande skriva utan min hjälp.",
    }),
  },
  {
    id: "t-letter-direct",
    suspectId: "thomas",
    tag: "BEVIS · BREVET",
    label: "Han skrev ditt namn. Pengar sedan mars.",
    available: (state) =>
      fresh(state, "t-letter-direct") &&
      clue(state, "letter") &&
      has(state, "t-admits-library") &&
      !has(state, "t-wary") &&
      !has(state, "t-admits-money"),
    resolve: (state, name) => ({
      grants: ["t-admits-money"],
      answer: has(state, "e-reed-asked")
        ? `${address(name)}, lägg inte brevet ovanpå det Hayes redan sagt. Ja. Jag tog från kontona, och jag frågade efter kodicillen för att hinna före. Han gav mig ingen tid att lägga tillbaka något.`
        : "Läs inte det högt i det här huset. Ja. Jag tog från kontona. Jag skulle ha lagt tillbaka det. Han gav mig inte tiden. Det är fortfarande inte gift.",
    }),
  },
  {
    id: "t-clock-raw",
    suspectId: "thomas",
    tag: "BEVIS · URET",
    label: "Klockan är krossad och visarna står på 22:15.",
    available: (state) =>
      fresh(state, "t-clock-raw") &&
      clue(state, "clock") &&
      has(state, "t-admits-library") &&
      !has(state, "c-clock-intact") &&
      !has(state, "t-clock-slip"),
    resolve: () => ({
      grants: ["t-clock-deflected"],
      answer:
        "Den föll väl när han föll. Tragiskt, inte misstänkt. Utan någon som såg uret tidigare på kvällen är det bara ett sönderfallande hus.",
    }),
  },
  {
    id: "t-clock",
    suspectId: "thomas",
    tag: "MOTSÄGELSE",
    label: "Clara drog upp uret klockan nio. Glaset var helt och tiden stämde.",
    available: (state) =>
      fresh(state, "t-clock") &&
      clue(state, "clock") &&
      has(state, "t-admits-library") &&
      has(state, "c-clock-intact") &&
      !has(state, "t-clock-slip"),
    resolve: (state) => ({
      grants: ["t-clock-slip"],
      answer: has(state, "t-clock-deflected")
        ? "Jag kallade det en olycka för att ni inte hade henne då. Nu säger hon att det gick rätt vid nio. …Den visade fel redan vid middagen. Så sa jag inte förut, nej. Ord mot ord."
        : "Den visade fel redan vid middagen. Alla som bryr sig om klockor i det här huset vet det. Om Clara säger något annat har hon missat en timme.",
    }),
  },
  {
    id: "t-poison-weak",
    suspectId: "thomas",
    tag: "BEVIS · GLASET",
    label: "Du förgiftade vinet. Glaset står kvar.",
    available: (state) =>
      fresh(state, "t-poison-weak") &&
      clue(state, "glass") &&
      has(state, "t-admits-library") &&
      !has(state, "t-admits-money") &&
      !has(state, "t-clock-slip"),
    resolve: () => ({
      grants: ["t-denied-weak"],
      answer:
        "Ett glas på ett bord. Han drack varje kväll. Jag tittade in, jag satte mig inte, och jag hällde ingenting. Kom tillbaka när glaset är mer än ett glas.",
    }),
  },
  {
    id: "t-poison-money",
    suspectId: "thomas",
    tag: "KONFRONTATION",
    label: "Du har erkänt pengarna. Glaset har en besk hinna.",
    available: (state) =>
      fresh(state, "t-poison-money") &&
      clue(state, "glass") &&
      has(state, "t-admits-money") &&
      !has(state, "t-clock-slip") &&
      !has(state, "t-confessed"),
    resolve: (state) => ({
      grants: ["t-denied-money"],
      answer: has(state, "t-denied-weak")
        ? "Ni frågade om glaset när ni inget hade. Nu har ni pengarna. Det är fortfarande inte gift. Säg när, och säg hur, eller släpp det."
        : "Jag har erkänt förskingringen. Det var dumt. Det var inte gift. Kom tillbaka när ni vet hur det hamnade i glaset, och när jag skulle ha hunnit.",
    }),
  },
  {
    id: "t-poison-clock",
    suspectId: "thomas",
    tag: "KONFRONTATION",
    label: "Uret ljuger för dig. Glaset också. Erkänn giftet.",
    available: (state) =>
      fresh(state, "t-poison-clock") &&
      clue(state, "glass") &&
      has(state, "t-clock-slip") &&
      !has(state, "t-admits-money") &&
      !has(state, "t-confessed"),
    resolve: (state) => ({
      grants: ["t-denied-clock"],
      answer: has(state, "c-wine-fresh")
        ? "Clara kan svära på sin karaff. Utan kontona har ni en krossad klocka och en lojal hushållerska. Det är inte ett motiv. Jag rörde visarna inte — den gick fel. Och jag rörde inte glaset."
        : has(state, "scene-kitchen-cork")
          ? "En kork från köket. Utan kontona är det en flaska och en krossad klocka. Jag rörde inte glaset."
          : "Klockor går sönder. Det gör inte mig till giftmördare. Visarna är ett gräl mellan mig och Clara, inte ett erkännande.",
    }),
  },
  {
    id: "t-poison-almost",
    suspectId: "thomas",
    tag: "KONFRONTATION",
    label: "Du var där, du ljög om klockan, och pengarna är borta. Glaset är ditt.",
    available: (state) =>
      fresh(state, "t-poison-almost") &&
      clue(state, "glass") &&
      has(state, "t-admits-money") &&
      has(state, "t-clock-slip") &&
      !wineProof(state) &&
      !has(state, "t-partial") &&
      !has(state, "t-confessed"),
    resolve: (state, name) => ({
      grants: ["t-partial"],
      answer: has(state, "c-offended")
        ? `Klockan och kontona kan ni behålla, ${address(name)}. Jag var där, och jag tänker inte låtsas att visarna är en olycka längre. Pengarna är borta. Men giftet? Hushållerskan litar inte på er, och utan hennes ord om karaffen är jag en tjuv. En jury vill ha mer. Det tänker jag inte ge er.`
        : `Jag var där. Jag ljög om tiden. Pengarna stämmer. Giftet nekar jag, ${address(name)}, för ni har aldrig fått Clara att säga att karaffen var orörd. Utan den meningen går jag härifrån som en tjuv, inte som en mördare.`,
    }),
  },
  {
    id: "t-poison-full",
    suspectId: "thomas",
    tag: "HELA KEDJAN",
    label: "Karaffen var ny. Uret var helt klockan nio. Pengarna är dina. Sluta.",
    available: (state) =>
      fresh(state, "t-poison-full") &&
      clue(state, "glass") &&
      has(state, "t-admits-money") &&
      has(state, "t-clock-slip") &&
      wineProof(state) &&
      !has(state, "t-confessed"),
    resolve: (state, name) => ({
      grants: ["t-confessed"],
      answer:
        has(state, "scene-kitchen-cork") && !has(state, "c-wine-fresh")
          ? `Korken i köket gör det, ${address(name)}. Den var ny, och Clara behövde inte säga det åt er. Jag lade det i hans glas, slog sönder uret och ställde visarna på kvart över tio. Han skulle ha avslöjat mig före gryningen.`
          : has(state, "t-wary")
            ? `Ni ljög för mig först, ${address(name)}. Det förändrar inte rummet. Clara korkade upp karaffen själv. Jag lade det i hans glas medan han vände sig mot brevet. Sedan slog jag sönder uret och ställde visarna på kvart över tio. Han skulle ha satt dit mig före gryningen.`
            : has(state, "t-partial")
              ? `Jag sa att ni saknade henne. Nu har ni hennes ord, ${address(name)}. Karaffen var orörd tills jag blev ensam med honom. Jag lade det i glaset, krossade uret och ställde visarna på 22:15. Nog. Skriv det.`
              : `Nog, ${address(name)}. Karaffen var nyöppnad, det har Clara rätt i. Jag lade det i hans glas medan han vände sig mot brevet. Sedan slog jag sönder uret och ställde visarna på kvart över tio, så att det skulle se ut som om jag redan satt i arbetsrummet. Han skulle ha avslöjat mig före gryningen. Jag gav honom inte chansen.`,
    }),
  },
];

export function availableChoices(suspectId: SuspectId, state: InquiryState) {
  return CHOICES.filter((choice) => choice.suspectId === suspectId && choice.available(state));
}

const HOUSE_LEADS: { suspectId: SuspectId; flag: string; stageId: string; room: string }[] = [
  { suspectId: "victoria", flag: "scene-terrace-prints", stageId: "gravel-follow", room: "Terrassen" },
  { suspectId: "edward", flag: "scene-codicil", stageId: "drawer-open", room: "Edwards rum" },
  { suspectId: "edward", flag: "scene-edward-ticket", stageId: "bag-open", room: "Edwards rum" },
  { suspectId: "clara", flag: "scene-kitchen-cork", stageId: "cork-cut", room: "Köket" },
  { suspectId: "clara", flag: "scene-kitchen-gap", stageId: "shelf-dust", room: "Köket" },
  { suspectId: "clara", flag: "scene-dining-left", stageId: "chair-turn", room: "Matsalen" },
  { suspectId: "thomas", flag: "scene-study-cold", stageId: "lamp-touch", room: "Arbetsrummet" },
  { suspectId: "thomas", flag: "scene-study-book", stageId: "book-open", room: "Arbetsrummet" },
];

export function roomsThatOpenQuestions(suspectId: SuspectId, state: InquiryState, examined: string[]) {
  const open = availableChoices(suspectId, state).length;
  const rooms: string[] = [];
  for (const lead of HOUSE_LEADS) {
    if (lead.suspectId !== suspectId || examined.includes(lead.stageId) || has(state, lead.flag)) continue;
    const next: InquiryState = { ...state, flags: [...state.flags, lead.flag] };
    if (availableChoices(suspectId, next).length > open && !rooms.includes(lead.room)) rooms.push(lead.room);
  }
  return rooms;
}

function knewReed(state: InquiryState) {
  return clue(state, "letter") || has(state, "v-named-reed") || has(state, "e-motive") || has(state, "t-admits-money");
}

export function judge(target: VerdictTarget, state: InquiryState, name: string): Verdict {
  const who = address(name);
  const path = pathSummary(state);
  const chain =
    has(state, "t-admits-money") &&
    has(state, "t-clock-slip") &&
    wineProof(state) &&
    has(state, "c-saw-reed") &&
    allClues(state);

  if (target === "thomas") {
    if (has(state, "t-confessed")) {
      return {
        title: "Erkännandet",
        kicker: "FALL 001 / AVSLUTAT",
        path,
        text: has(state, "t-wary")
          ? `${who}, han är bitter över att du bluffade honom, men rummet är färdigräknat. Thomas Reed lade giftet i glaset, slog sönder uret och ställde visarna på 22:15. Alistair skulle ha avslöjat pengarna före gryningen. Gruppen har både orden och bevisen.`
          : `${who}, Thomas Reed slutar spela. Han lade giftet i glaset, slog sönder uret och ställde visarna på 22:15. Motivet låg i brevet och i pengarna: Alistair skulle ha avslöjat honom före gryningen. Blackwood Manor får en morgon, och en skyldig.`,
      };
    }
    if (chain) {
      return {
        title: "Åtalet håller",
        kicker: "FALL 001 / BEVIS",
        path,
        text:
          has(state, "scene-kitchen-cork") && !has(state, "c-wine-fresh")
            ? `${who}, Reed nekar en sista gång, men korken i köket gör det Clara inte ville säga. Han sågs gå in, uret var helt klockan nio, och visarna är tvingade till 22:15. Ni lade aldrig fram den sista frågan. Bevisen räcker ändå.`
            : `${who}, Reed nekar en sista gång, men han behöver inte erkänna. Clara såg honom gå in, karaffen var orörd innan dess, uret var helt klockan nio och visarna är tvingade till 22:15. Ni lade aldrig fram den sista frågan. Bevisen räcker ändå.`,
      };
    }
    if (has(state, "t-partial") && wineProof(state)) {
      return {
        title: "Korken ändrar målet",
        kicker: "FALL 001 / BEVIS",
        path,
        text: `${who}, han nekade giftet för att karaffen saknade ett vittne. Sedan låg korken i köket, nyskuren. Ni pekade på honom utan att lägga fram den. Åtalet kan fortfarande bäras av det ni hittade i huset.`,
      };
    }
    if (!wineProof(state) && (has(state, "t-partial") || (has(state, "t-admits-money") && has(state, "t-clock-slip")))) {
      return {
        title: "Rätt man, fel grepp",
        kicker: "FALL 001 / TUNNT",
        path,
        text: has(state, "c-offended")
          ? `${who}, Reed medger rummet, klockan och pengarna. Giftet nekar han. Du mötte Clara med misstro, och utan hennes ord om karaffen kallar han sig tjuv och går ut genom porten. Sanningen var nära. Tonen kostade er resten.`
          : `${who}, du kan sätta Reed i biblioteket och i bokföringen, men inte i glaset. Du frågade aldrig Clara på ett sätt som fick henne att berätta om karaffen. Han lämnar huset som tjuv. Inte som mördare.`,
      };
    }
    if (has(state, "t-admits-money") && has(state, "c-saw-reed") && !has(state, "t-clock-slip")) {
      return {
        title: "Motiv utan tid",
        kicker: "FALL 001 / ÖPPET",
        path,
        text: `${who}, du kan visa att Reed var i rummet och att han hade skäl. Utan urets motsägelse kan han fortfarande säga att han gick innan glaset tömdes. Fallet stannar i hallen.`,
      };
    }
    return {
      title: "Han går fri",
      kicker: "FALL 001 / FÖRLORAT",
      path,
      text: `${who}, Reed är rätt namn och fel akt. Ett brev, ett gräl eller ett glas räcker inte var för sig, och du har inte knutit ihop dem. Han tar tåget vid gryningen. Pengarna följer med.`,
    };
  }

  if (target === "victoria") {
    if (has(state, "v-hostile") && knewReed(state)) {
      return {
        title: "Fel sorg",
        kicker: "FALL 001 / FEL",
        path,
        text: `${who}, du hade Reeds namn och valde ändå systern, efter att ha stängt hennes mun. Victoria förs ut. Reed ordnar böckerna, låser biblioteket och försvinner.`,
      };
    }
    if (has(state, "v-hostile")) {
      return {
        title: "En anklagelse för tidigt",
        kicker: "FALL 001 / FEL",
        path,
        text: `${who}, du fällde Victoria medan hon fortfarande kunde ha berättat om glaset och om Reed. Hon säger inget mer. Mördaren behöver inte ljuga. Du gjorde jobbet åt honom.`,
      };
    }
    if (knewReed(state)) {
      return {
        title: "Systern",
        kicker: "FALL 001 / FEL",
        path,
        text: `${who}, Victoria talade sanning om trädgården, och du hörde det. Ändå pekade du på henne. Hon ser på dig som på en gäst som svikit huset. Reed lämnar en kondoleans och ett tomt konto.`,
      };
    }
    return {
      title: "Den enkla misstänkta",
      kicker: "FALL 001 / FEL",
      path,
      text: `${who}, grälet gjorde henne synlig, och du stannade där. Victoria hade ilska, inte gift. När domen faller är Reed redan borta.`,
    };
  }

  if (target === "edward") {
    if (has(state, "e-deal")) {
      return {
        title: "Budbäraren",
        kicker: "FALL 001 / FEL",
        path,
        text: `${who}, Edward gav dig Reed, middagen och kodicillen, mot att du inte skulle använda det mot honom. Du låste in budbäraren. Reed hör domen från hallen och höjer ett glas han inte rörde.`,
      };
    }
    if (has(state, "e-hid-codicil")) {
      return {
        title: "En fegis i cellen",
        kicker: "FALL 001 / FEL",
        path,
        text: `${who}, Edward erkände rädsla och ett gömt testamente. Det var feghet, och du kallade det mord. Reed skriver ett nytt avtal innan veckan är slut.`,
      };
    }
    if (has(state, "e-motive")) {
      return {
        title: "Brevet pekade åt ett annat håll",
        kicker: "FALL 001 / FEL",
        path,
        text: `${who}, Edward bekräftade att Alistair skrev om Reed och pengarna. Du fällde ändå advokaten. Papperet överlever domen. Mannen det namnger gör det också.`,
      };
    }
    return {
      title: "Papper är inte gift",
      kicker: "FALL 001 / FEL",
      path,
      text: `${who}, ett saknat dokument är ett advokatproblem. Du gjorde det till ett mordåtal. Edward tiger, målet spricker, och den som hade skäl att skynda sig lämnar herrgården med nycklarna till kontona.`,
    };
  }

  if (target === "clara") {
    if (has(state, "c-wine-fresh")) {
      return {
        title: "Vittnet",
        kicker: "FALL 001 / FEL",
        path,
        text: `${who}, Clara berättade att karaffen var ny och att bara den som blev kvar kunde ha rört glaset. Du använde nyckeln mot henne. Huset vänder sig bort. Reed tackar dig i porten, artigt, och reser.`,
      };
    }
    if (has(state, "c-offended")) {
      return {
        title: "Förklädet",
        kicker: "FALL 001 / FEL",
        path,
        text: `${who}, du misstrodde henne redan i rummet, och sedan anklagade du henne. Ingen i personalen säger ett ord till. Den riktiga berättelsen stannar i köket. Reed går.`,
      };
    }
    return {
      title: "Sist i rummet",
      kicker: "FALL 001 / FEL",
      path,
      text: `${who}, hon bar in vinet, och därför valde du henne. Tillfälle är inte skuld. Reed skriver sitt namn i gästboken på vägen ut, som en man utan brådska.`,
    };
  }

  if (has(state, "t-confessed")) {
    return {
      title: "Erkännandet i lådan",
      kicker: "FALL 001 / ÖPPET",
      path,
      text: `${who}, han sa det. Du hörde det. Sedan stängde du akten utan att peka. Reed tar tillbaka meningen innan vittnena hinner skriva under. Sanningen fick en natt, och ingen morgon.`,
    };
  }
  if (chain || (allClues(state) && has(state, "c-saw-reed") && has(state, "t-admits-money") && wineProof(state))) {
    return {
      title: "Akten var hel",
      kicker: "FALL 001 / ÖPPET",
      path,
      text: `${who}, klockan, brevet, glaset och vittnena ligger i ordning. Du lämnar dem olästa för rätten. Reed förstår det och packar i lugn.`,
    };
  }
  if (state.clues.length > 0 || state.flags.length > 0) {
    return {
      title: "Natten tar slut",
      kicker: "FALL 001 / ÖPPET",
      path,
      text: `${who}, ni har börjat. Motsägelserna är inte ihopknutna, och gryningen kommer ändå. Fallet läggs vilande. De misstänkta går till sina rum. En annan fråga hade öppnat en annan dörr.`,
    };
  }
  return {
    title: "Ingen slutsats",
    kicker: "FALL 001 / ÖPPET",
    path,
    text: `${who}, fyra namn och inga svar. Blackwood ligger kvar i biblioteket, och huset behåller sin hemlighet en natt till. Nästa gång kan en annan ton ge ett annat slut.`,
  };
}
