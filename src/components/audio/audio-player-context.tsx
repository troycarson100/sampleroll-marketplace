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

/** What’s playing in the global player (pack demo or a sample row). */
export type CurrentSample = {
  id: string;
  previewUrl: string;
  label: string;
  source?: "pack_demo" | "sample";
  packId?: string;
  coverUrl?: string | null;
  /** Secondary line (tags / genre) */
  subtitle?: string;
  bpm?: number | null;
  key?: string | null;
};

export type PlayOptions = {
  /** 0–1: start playback at this position (e.g. waveform click). */
  startPercent?: number;
};

type AudioPlayerContextValue = {
  currentSample: CurrentSample | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  canPrev: boolean;
  canNext: boolean;
  play: (sample: CurrentSample, options?: PlayOptions) => void;
  pause: () => void;
  toggle: () => void;
  prev: () => void;
  next: () => void;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
  setQueue: (items: CurrentSample[]) => void;
  /** Move by ±N tracks in the current queue (clamped). Used for keyboard fast-skip. */
  jumpQueue: (delta: number) => void;
};

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(
  null,
);

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRafRef = useRef<number | null>(null);
  const currentIdRef = useRef<string | null>(null);
  const queueRef = useRef<CurrentSample[]>([]);
  const [currentSample, setCurrentSample] = useState<CurrentSample | null>(
    null,
  );
  const [queueIndex, setQueueIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);

  useEffect(() => {
    const el = new Audio();
    el.preload = "auto";
    /** When a track ends naturally, replay it — do not auto-advance the queue. */
    el.loop = true;
    audioRef.current = el;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => {
      setIsPlaying(false);
      setCurrentTime(el.currentTime);
    };
    const onDur = () => {
      const d = el.duration;
      setDuration(Number.isFinite(d) ? d : 0);
    };
    /** When tab is in background, rAF is throttled — keep progress roughly in sync. */
    const onTime = () => {
      if (typeof document !== "undefined" && document.hidden) {
        setCurrentTime(el.currentTime);
      }
    };

    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("durationchange", onDur);
    el.addEventListener("loadedmetadata", onDur);

    return () => {
      el.pause();
      el.removeAttribute("src");
      el.load();
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("durationchange", onDur);
      el.removeEventListener("loadedmetadata", onDur);
      audioRef.current = null;
    };
    /** Single Audio instance for the app lifetime — do NOT depend on queueIndex here:
     *  changing queue would destroy the element mid-playback and break play/prev/next. */
  }, []);

  /** Smooth progress: ~60fps while playing (timeupdate is too sparse and looks jumpy). */
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !isPlaying) {
      if (progressRafRef.current != null) {
        cancelAnimationFrame(progressRafRef.current);
        progressRafRef.current = null;
      }
      return;
    }

    const loop = () => {
      const a = audioRef.current;
      if (!a || a.paused || a.ended) {
        progressRafRef.current = null;
        if (a?.ended) {
          setCurrentTime(a.duration || 0);
        }
        return;
      }
      setCurrentTime(a.currentTime);
      progressRafRef.current = requestAnimationFrame(loop);
    };

    progressRafRef.current = requestAnimationFrame(loop);
    return () => {
      if (progressRafRef.current != null) {
        cancelAnimationFrame(progressRafRef.current);
        progressRafRef.current = null;
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = clamp01(volume);
    }
  }, [volume]);

  const play = useCallback((sample: CurrentSample, options?: PlayOptions) => {
    const el = audioRef.current;
    if (!el) return;
    const startPct = options?.startPercent;

    if (currentIdRef.current === sample.id) {
      if (startPct != null && Number.isFinite(startPct)) {
        const pct = clamp01(startPct);
        const applySeek = () => {
          const d = el.duration;
          if (Number.isFinite(d) && d > 0) {
            el.currentTime = pct * d;
            setCurrentTime(el.currentTime);
            setDuration(d);
          }
        };
        if (el.readyState >= HTMLMediaElement.HAVE_METADATA) {
          applySeek();
        } else {
          const once = () => {
            el.removeEventListener("loadedmetadata", once);
            applySeek();
          };
          el.addEventListener("loadedmetadata", once);
        }
        if (el.paused) void el.play().catch(() => {});
        return;
      }
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
    const i = queueRef.current.findIndex((q) => q.id === sample.id);
    if (i >= 0) setQueueIndex(i);
    setCurrentTime(0);
    setDuration(0);

    const applyStart = () => {
      const d = el.duration;
      if (!Number.isFinite(d) || d <= 0) return;
      setDuration(d);
      if (startPct != null && Number.isFinite(startPct)) {
        const t = clamp01(startPct) * d;
        el.currentTime = t;
        setCurrentTime(t);
      }
    };

    if (startPct != null && Number.isFinite(startPct)) {
      if (el.readyState >= HTMLMediaElement.HAVE_METADATA) {
        applyStart();
      } else {
        const once = () => {
          el.removeEventListener("loadedmetadata", once);
          applyStart();
        };
        el.addEventListener("loadedmetadata", once);
      }
    }

    void el.play().catch(() => {
      currentIdRef.current = null;
      setIsPlaying(false);
    });
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el || !currentSample) return;
    if (el.paused) {
      void el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [currentSample]);

  const prev = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    const q = queueRef.current;
    if (queueIndex <= 0 || queueIndex >= q.length) return;
    const target = q[queueIndex - 1];
    if (!target) return;
    setQueueIndex((i) => i - 1);
    el.pause();
    el.src = target.previewUrl;
    currentIdRef.current = target.id;
    setCurrentSample(target);
    setCurrentTime(0);
    setDuration(0);
    void el.play().catch(() => setIsPlaying(false));
  }, [queueIndex]);

  const next = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    const q = queueRef.current;
    if (queueIndex < 0 || queueIndex >= q.length - 1) return;
    const target = q[queueIndex + 1];
    if (!target) return;
    setQueueIndex((i) => i + 1);
    el.pause();
    el.src = target.previewUrl;
    currentIdRef.current = target.id;
    setCurrentSample(target);
    setCurrentTime(0);
    setDuration(0);
    void el.play().catch(() => setIsPlaying(false));
  }, [queueIndex]);

  const jumpQueue = useCallback((delta: number) => {
    const el = audioRef.current;
    if (!el || delta === 0) return;
    const q = queueRef.current;
    if (q.length === 0) return;
    const currentId = currentIdRef.current;
    const idx = currentId ? q.findIndex((x) => x.id === currentId) : -1;
    if (idx < 0) return;
    const nextIdx = Math.max(0, Math.min(q.length - 1, idx + delta));
    if (nextIdx === idx) return;
    const target = q[nextIdx];
    if (!target) return;
    setQueueIndex(nextIdx);
    el.pause();
    el.src = target.previewUrl;
    currentIdRef.current = target.id;
    setCurrentSample(target);
    setCurrentTime(0);
    setDuration(0);
    void el.play().catch(() => setIsPlaying(false));
  }, []);

  const seek = useCallback((seconds: number) => {
    const el = audioRef.current;
    if (!el) return;
    const d = el.duration;
    const max = Number.isFinite(d) && d > 0 ? d : seconds;
    el.currentTime = Math.max(0, Math.min(seconds, max));
    setCurrentTime(el.currentTime);
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(clamp01(v));
  }, []);

  const setQueue = useCallback((items: CurrentSample[]) => {
    const normalized = items.filter((i) => i.previewUrl);
    queueRef.current = normalized;
    if (!currentIdRef.current) {
      setQueueIndex(-1);
      return;
    }
    const idx = normalized.findIndex((i) => i.id === currentIdRef.current);
    setQueueIndex(idx);
  }, []);

  const canPrev = queueIndex > 0;
  const canNext = queueIndex >= 0 && queueIndex < queueRef.current.length - 1;

  const value = useMemo(
    () => ({
      currentSample,
      isPlaying,
      currentTime,
      duration,
      volume,
      canPrev,
      canNext,
      play,
      pause,
      toggle,
      prev,
      next,
      seek,
      setVolume,
      setQueue,
      jumpQueue,
    }),
    [
      currentSample,
      isPlaying,
      currentTime,
      duration,
      volume,
      canPrev,
      canNext,
      play,
      pause,
      toggle,
      prev,
      next,
      seek,
      setVolume,
      setQueue,
      jumpQueue,
    ],
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
