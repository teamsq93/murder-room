import type { ClueId } from "./mystery";

export type Stage = {
  id: string;
  action: string;
  text: string;
  clue?: ClueId;
  flag?: string;
};

export type ManorObject = {
  id: string;
  name: string;
  hint: string;
  icon: string;
  stages: Stage[];
};

export type ManorRoom = {
  id: string;
  name: string;
  place: string;
  summary: string;
  scene: string;
  image: string;
  crime?: boolean;
  objects: ManorObject[];
};

export const ROOMS: ManorRoom[] = [
  {
    id: "library",
    name: "Biblioteket",
    image: "/rooms/library.jpg",
    place: "Västra flygeln",
    summary: "Här dog han. Dörren står på glänt.",
    scene: "Lamporna är tända. Det luktar läder, damm och något bittert. Inget har blivit flyttat sedan skriket.",
    crime: true,
    objects: [
      {
        id: "body",
        name: "Lord Alistair",
        hint: "Han sitter kvar vid skrivbordet.",
        icon: "†",
        stages: [
          {
            id: "body-look",
            action: "SE EFTER",
            text: "Han lutar mot skrivbordet. Ingen synlig skada, kinderna är grå, och den bittra lukten kommer från glaset intill hans hand.",
          },
        ],
      },
      {
        id: "desk",
        name: "Skrivbordet",
        hint: "Papper, en penna och något som ligger vänt nedåt.",
        icon: "▭",
        stages: [
          {
            id: "desk-look",
            action: "UNDERSÖK SKRIVBORDET",
            text: "Underlägget är fläckat av färskt bläck. Pennan saknar huv. Ett kuvert med helt sigill ligger vänt nedåt, halvt under ett tomt ark.",
          },
          {
            id: "desk-letter",
            action: "VÄND OCH ÖPPNA BREVET",
            clue: "letter",
            text: "Sigillet spricker. Texten är kort: ”Edward — siffrorna stämmer inte. Reed har flyttat pengar sedan mars. Jag konfronterar honom i kväll.”",
          },
        ],
      },
      {
        id: "clock",
        name: "Bordsuren",
        hint: "Något har fallit på mattan.",
        icon: "◷",
        stages: [
          {
            id: "clock-look",
            action: "TA UPP URET",
            text: "Ett bordsur ligger på sidan. Glaset är borta. Det ser ut att ha slagits ned från skrivbordskanten.",
          },
          {
            id: "clock-hands",
            action: "GRANSKA VISARNA",
            clue: "clock",
            text: "Glaset är slaget ut från urtavlan, och visarna är böjda till exakt 22:15. En klocka som stannar av sig själv ser inte ut så här. Någon har ställt tiden.",
          },
        ],
      },
      {
        id: "glass",
        name: "Vinglaset",
        hint: "Ett glas står kvar bland papperen.",
        icon: "◇",
        stages: [
          {
            id: "glass-look",
            action: "SE PÅ GLASET",
            text: "Det är det enda glaset i rummet. En skvätt står kvar i botten. Fatet under det är torrt.",
          },
          {
            id: "glass-lift",
            action: "LYFT GLASET",
            clue: "glass",
            text: "En besk hinna täcker botten. På foten sitter ett färskt bläckstreck, som från en hand som just hållit en penna.",
          },
        ],
      },
    ],
  },
  {
    id: "study",
    name: "Arbetsrummet",
    image: "/rooms/study.jpg",
    place: "Östra flygeln",
    summary: "Reed säger att han satt här.",
    scene: "Rummet är mörkare än hallen. En stol, en lampa, och inga tecken på brådska.",
    objects: [
      {
        id: "lamp",
        name: "Skrivbordslampan",
        hint: "Lampan är släckt. Stolen är inskjuten.",
        icon: "⌁",
        stages: [
          {
            id: "lamp-look",
            action: "SE DIG OM",
            text: "Inget ligger framme. Läskpappret är slätt, och stolen ser ut att ha stått så en stund.",
          },
          {
            id: "lamp-touch",
            action: "KÄNN PÅ LAMPAN",
            flag: "scene-study-cold",
            text: "Kupans glas är kallt. Läskpappret under lampan är torrt. Ingen har suttit här och skrivit den senaste timmen.",
          },
        ],
      },
      {
        id: "book",
        name: "Räkenskapsboken",
        hint: "En tjock bok ligger stängd på skrivbordet.",
        icon: "☰",
        stages: [
          {
            id: "book-look",
            action: "SE PÅ BOKEN",
            text: "Pärmen är dammig i kanterna. Inget bokmärke sticker ut.",
          },
          {
            id: "book-open",
            action: "SLÅ UPP DEN",
            flag: "scene-study-book",
            text: "Sidorna faller upp styvt. Inget färskt bläck. Den har inte använts i kväll.",
          },
        ],
      },
    ],
  },
  {
    id: "dining",
    name: "Matsalen",
    image: "/rooms/dining.jpg",
    place: "Bottenvåningen",
    summary: "Middagen blev aldrig avdukad.",
    scene: "Stearinljusen har brunnit ner. Fyra kuvert står kvar, ett av dem övergivet.",
    objects: [
      {
        id: "places",
        name: "Kuverten",
        hint: "Namnkorten sitter kvar vid tallrikarna.",
        icon: "☰",
        stages: [
          {
            id: "places-look",
            action: "GÅ RUNT BORDET",
            text: "Victoria, Edward, Clara tjänstgjorde. Alistairs stol är utdragen. Reeds kort sitter vid ett glas som ingen har rört.",
          },
          {
            id: "places-glass",
            action: "JÄMFÖR GLASEN",
            flag: "scene-reed-glass",
            text: "Reeds glas är fortfarande fullt. Alistairs plats är tom. Bara ett glas lämnade matsalen, och det står nu i biblioteket.",
          },
        ],
      },
      {
        id: "chair",
        name: "Alistairs stol",
        hint: "En stol står snett mot dörren.",
        icon: "⌂",
        stages: [
          {
            id: "chair-look",
            action: "SE PÅ STOLEN",
            text: "Den är utdragen, men inte in mot bordet.",
          },
          {
            id: "chair-turn",
            action: "FÖLJ RIKTNINGEN",
            flag: "scene-dining-left",
            text: "Stolen pekar mot dörren till biblioteket. Han reste sig och gick dit. Han satte sig inte igen.",
          },
        ],
      },
    ],
  },
  {
    id: "kitchen",
    name: "Köket",
    image: "/rooms/kitchen.jpg",
    place: "Bottenvåningen",
    summary: "Härifrån bars vinet in.",
    scene: "Kopparn är undanplockad. En skärbräda ligger kvar under lampan.",
    objects: [
      {
        id: "cork",
        name: "Skärbrädan",
        hint: "Något litet ligger bredvid kniven.",
        icon: "○",
        stages: [
          {
            id: "cork-look",
            action: "SE PÅ BÄNKEN",
            text: "Karaffen saknas på hyllan där den brukar stå. En kork och lite vax ligger på brädan.",
          },
          {
            id: "cork-cut",
            action: "GRANSKA KORKEN",
            flag: "scene-kitchen-cork",
            text: "Snittet är färskt och jämnt, gjort i kväll. Vaxet är fortfarande mjukt. Karaffen som hör till korken är borta.",
          },
        ],
      },
      {
        id: "shelf",
        name: "Karaffhyllan",
        hint: "En tom fläck i dammet.",
        icon: "▭",
        stages: [
          {
            id: "shelf-look",
            action: "SE PÅ HYLLAN",
            text: "De andra flaskorna står tätt. Ett mellanrum är tomt.",
          },
          {
            id: "shelf-dust",
            action: "KÄNN I DAMMET",
            flag: "scene-kitchen-gap",
            text: "Ringen i dammet är skarp. Karaffen stod här tills i kväll.",
          },
        ],
      },
    ],
  },
  {
    id: "terrace",
    name: "Terrassen",
    image: "/rooms/terrace.jpg",
    place: "Trädgården",
    summary: "Victoria säger att hon gick ut.",
    scene: "Luften är kall. Biblioteksfönstret lyser bakom er.",
    objects: [
      {
        id: "bench",
        name: "Stenbänken",
        hint: "Terrassen ser tom ut vid första anblicken.",
        icon: "⌒",
        stages: [
          {
            id: "bench-look",
            action: "GÅ LÄNGS RÄCKET",
            text: "Gruset är fuktigt. Inga fotspår går längre än till bänken. Fönstret in till biblioteket står på glänt.",
          },
          {
            id: "bench-shawl",
            action: "TITTA PÅ BÄNKEN",
            flag: "scene-shawl",
            text: "En sjal ligger hopvikt mot stenen. Tyget är lätt varmt. Härifrån ser man skrivbordet, men inte vem som rör sig bakom det.",
          },
        ],
      },
      {
        id: "gravel",
        name: "Gruset",
        hint: "Något har trampats ner mot bänken.",
        icon: "∴",
        stages: [
          {
            id: "gravel-look",
            action: "SE PÅ GRUSET",
            text: "Fuktiga spår går från dörren och ut.",
          },
          {
            id: "gravel-follow",
            action: "FÖLJ SPÅREN",
            flag: "scene-terrace-prints",
            text: "De slutar vid bänken. Inget spår vänder tillbaka mot husdörren.",
          },
        ],
      },
    ],
  },
  {
    id: "edward",
    name: "Edwards rum",
    image: "/rooms/edward.jpg",
    place: "Övre våningen",
    summary: "Advokatens väska står vid sängen.",
    scene: "Rummet är prydligt på ett sätt som döljer mer än det visar.",
    objects: [
      {
        id: "drawer",
        name: "Skrivbordslådan",
        hint: "En låda sticker ut en aning.",
        icon: "▢",
        stages: [
          {
            id: "drawer-look",
            action: "SE PÅ SKRIVBORDET",
            text: "Ytan är tom. Den översta lådan är inte riktigt i linje med de andra, som om den sköts igen i hast.",
          },
          {
            id: "drawer-open",
            action: "DRA UT LÅDAN",
            flag: "scene-codicil",
            text: "Under ett tomt kuvert ligger kodicillen. Alistair stryker Thomas Reed som förmånstagare och lägger kapitalet i en stiftelse. Bläcket är hans.",
          },
        ],
      },
      {
        id: "bag",
        name: "Väskan",
        hint: "En läderväska står vid sängen.",
        icon: "▣",
        stages: [
          {
            id: "bag-look",
            action: "SE PÅ VÄSKAN",
            text: "Den står vid sängen, stängd men olåst. Handtaget är vänt mot dörren, som om han tänkte ta den med sig.",
          },
          {
            id: "bag-open",
            action: "ÖPPNA VÄSKAN",
            flag: "scene-edward-ticket",
            text: "Inuti ligger en enkel biljett. Första tåget mot London, i morgon bitti. Resten av väskan är nästan tom.",
          },
        ],
      },
    ],
  },
];

export const HOUSE_FLAGS: string[] = ROOMS.filter((room) => !room.crime).flatMap((room) =>
  room.objects.flatMap((object) => object.stages.flatMap((stage) => (stage.flag ? [stage.flag] : []))),
);

export function roomProgress(room: ManorRoom, examined: string[]) {
  const total = room.objects.reduce((sum, object) => sum + object.stages.length, 0);
  const done = room.objects.reduce(
    (sum, object) => sum + object.stages.filter((stage) => examined.includes(stage.id)).length,
    0,
  );
  return { done, total };
}
