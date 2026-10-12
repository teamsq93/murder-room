import { useEffect, useRef, useState } from "react";
import { tx } from "./locale";
import { ManorScore } from "./music";

const KEY = "murder-room-music";

function musicWanted() {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

function rememberMusic(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    /* The preference is only kept for this visit. */
  }
}

export function MusicControl() {
  const [on, setOn] = useState(musicWanted);
  const [playing, setPlaying] = useState(false);
  const score = useRef<ManorScore | null>(null);
  const onRef = useRef(on);
  onRef.current = on;

  useEffect(() => {
    const manor = new ManorScore();
    manor.onChange = setPlaying;
    score.current = manor;
    const begin = () => {
      if (onRef.current) void manor.start();
    };
    window.addEventListener("pointerdown", begin);
    return () => {
      window.removeEventListener("pointerdown", begin);
      manor.onChange = null;
      manor.stop();
      score.current = null;
    };
  }, []);

  function toggle() {
    const next = !onRef.current;
    setOn(next);
    rememberMusic(next);
    const manor = score.current;
    if (!manor) return;
    if (next) void manor.start();
    else manor.stop();
  }

  return (
    <button
      className={on ? "music-toggle on" : "music-toggle"}
      type="button"
      aria-pressed={on}
      aria-label={on ? tx("Stäng av musiken", "Turn the music off") : tx("Sätt på musiken", "Turn the music on")}
      data-playing={playing ? "yes" : "no"}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={toggle}
    >
      <span aria-hidden="true">♫</span>
      <span className="music-word">{on ? tx("PÅ", "ON") : tx("AV", "OFF")}</span>
    </button>
  );
}
