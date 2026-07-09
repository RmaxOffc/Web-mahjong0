"use client";

import { useEffect, useRef } from "react";

const MUSIC_URL = "https://files.catbox.moe/470eq8.mp3";

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const audio = new Audio(MUSIC_URL);
    audio.loop = true;
    audio.volume = 1;
    audioRef.current = audio;

    const tryStart = () => {
      if (startedRef.current) return;
      audio
        .play()
        .then(() => {
          startedRef.current = true;
        })
        .catch(() => {
          // Diblokir browser (belum ada interaksi) - nanti dicoba lagi
          // lewat listener interaksi di bawah.
        });
    };

    tryStart();

    const onInteract = () => {
      tryStart();
      if (startedRef.current) {
        window.removeEventListener("click", onInteract);
        window.removeEventListener("keydown", onInteract);
        window.removeEventListener("touchstart", onInteract);
      }
    };

    window.addEventListener("click", onInteract);
    window.addEventListener("keydown", onInteract);
    window.addEventListener("touchstart", onInteract);

    return () => {
      window.removeEventListener("click", onInteract);
      window.removeEventListener("keydown", onInteract);
      window.removeEventListener("touchstart", onInteract);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  return null;
        }
