import { tr, tx } from "./locale";
import { ROOMS, roomProgress, type Stage } from "./manor";
import { stageCopy } from "./nights";

type ManorViewProps = {
  examined: string[];
  roomId: string | null;
  company: (roomId: string) => string[];
  onEnter: (roomId: string) => void;
  onLeave: () => void;
  onExamine: (stage: Stage) => void;
};

function withOthers(names: string[]) {
  if (names.length === 1) return names[0];
  const and = tx("och", "and");
  return `${names.slice(0, -1).join(", ")} ${and} ${names[names.length - 1]}`;
}

export function ManorView({ examined, roomId, company, onEnter, onLeave, onExamine }: ManorViewProps) {
  const room = ROOMS.find((item) => item.id === roomId);

  if (!room) {
    return (
      <div>
        <h2>{tx("HERRGÅRDEN", "THE MANOR")}</h2>
        <p className="muted">
          {tx(
            "Sex rum är öppna i natt. Det första ni ser är sällan det som betyder något.",
            "Six rooms are open tonight. The first thing you see is rarely the thing that matters.",
          )}
        </p>
        <div className="room-grid">
          {ROOMS.map((item) => {
            const progress = roomProgress(item, examined);
            const here = company(item.id);
            const status =
              progress.done === 0
                ? tx("Stig in →", "Step in →")
                : progress.done === progress.total
                  ? tx("✓ GENOMSÖKT", "✓ SEARCHED")
                  : tx(`PÅBÖRJAT · ${progress.done}/${progress.total}`, `STARTED · ${progress.done}/${progress.total}`);
            return (
              <button
                key={item.id}
                type="button"
                className={`room-card ${item.crime ? "crime" : ""} ${progress.done === progress.total ? "done" : ""}`}
                onClick={() => onEnter(item.id)}
              >
                {progress.done === progress.total && (
                  <span className="examined-mark" aria-hidden="true">
                    ✓
                  </span>
                )}
                <span className="room-head">
                  <span>
                    <span className="label">{item.crime ? tx("BROTTSPLATS", "CRIME SCENE") : tr(item.place)}</span>
                    <strong>{tr(item.name)}</strong>
                  </span>
                  <img className="room-thumb" src={item.image} alt="" />
                </span>
                <p>{tr(item.summary)}</p>
                {here.length > 0 && (
                  <p className="room-company">
                    {tx(
                      `${withOthers(here)} är här`,
                      `${withOthers(here)} ${here.length > 1 ? "are" : "is"} here`,
                    )}
                  </p>
                )}
                <span className="evidence-action">{status}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button className="secondary-button back-button" type="button" onClick={onLeave}>
        ← {tx("TILL PLANLÖSNINGEN", "TO THE FLOOR PLAN")}
      </button>
      <p className="eyebrow room-kicker">{room.crime ? tx("BROTTSPLATS", "CRIME SCENE") : tr(room.place)}</p>
      <h2 className="room-title">{tr(room.name)}</h2>
      {company(room.id).length > 0 && (
        <p className="room-company">
          {tx(
            `${withOthers(company(room.id))} är också här`,
            `${withOthers(company(room.id))} ${company(room.id).length > 1 ? "are" : "is"} also here`,
          )}
        </p>
      )}
      <p className="muted">{tr(room.scene)}</p>
      <div className="object-grid">
        {room.objects.map((object) => {
          const revealed = object.stages.filter((stage) => examined.includes(stage.id));
          const next = object.stages.find((stage) => !examined.includes(stage.id));
          return (
            <button
              key={object.id}
              type="button"
              className={`evidence-card ${next ? "" : "collected"}`}
              disabled={!next}
              onClick={() => {
                if (next) onExamine(next);
              }}
            >
              {!next && (
                <span className="examined-mark" aria-hidden="true">
                  ✓
                </span>
              )}
              <span className="evidence-icon">{object.icon}</span>
              <strong>{tr(object.name)}</strong>
              {revealed.length === 0 && <p>{tr(object.hint)}</p>}
              {revealed.map((stage) => (
                <p key={stage.id} className="clue-detail">
                  {tr(stageCopy(stage.id, stage.text))}
                </p>
              ))}
              <span className="evidence-action">{next ? `${tr(next.action)} →` : tx("✓ UNDERSÖKT", "✓ EXAMINED")}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
