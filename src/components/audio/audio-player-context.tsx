"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type CurrentSample = {
  id: string;
  previewUrl: string;
  label: string;
};

type AudioPlayerContextValue = {
  currentSample: CurrentSample | null;
  isPlaying: boolean;
  play: (sample: CurrentSample) => void;
  pause: () => void;
};

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentIdRef = useRef<string | null>(null);
  const [currentSample, setCurrentSample] = useState<CurrentSample | null>(
    null,
  );
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const el = new Audio();
    el.preload = "auto";
    audioRef.current = el;

    const onEnded = () => {
      currentIdRef.current = null;
      setIsPlaying(false);
      setCurrentSample(null);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    el.addEventListener("ended", onEnded);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);

    return () => {
      el.pause();
      el.removeAttribute("src");
      el.load();
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      audioRef.current = null;
    };
  }, []);

  const play = useCallback((sample: CurrentSample) => {
    const el = audioRef.current;
    if (!el) return;

    if (currentIdRef.current === sample.id) {
      if (el.paused) {
        void el.play().catch(() => {});
      } else {
        el.pause();
      }
      return;
    }

    el.pause();
    el.src = sample.previewUrl;
    currentIdRef.current = sample.id;
    setCurrentSample(sample);
    void el.play().catch(() => {
      currentIdRef.current = null;
      setIsPlaying(false);
    });
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const value = useMemo(
    () => ({
      currentSample,
      isPlaying,
      play,
      pause,
    }),
    [currentSample, isPlaying, play, pause],
  );

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) {
    throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  }
  return ctx;
}
