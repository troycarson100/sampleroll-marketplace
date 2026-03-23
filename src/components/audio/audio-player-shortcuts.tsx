"use client";

import { useEffect, useRef } from "react";
import { useAudioPlayer } from "@/components/audio/audio-player-context";

/** Tracks to skip when holding Shift + Up/Down (fast queue navigation). */
export const AUDIO_PLAYER_FAST_SKIP_STEPS = 5;

/** Fraction of total duration to jump per ← / → keypress. */
export const AUDIO_PLAYER_SEEK_STEP = 0.1;

function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return el.closest("[contenteditable='true']") != null;
}

/**
 * Global keyboard controls for the audio player (must render inside AudioPlayerProvider).
 * - ← / → seek ±10% of track duration
 * - ↑ / ↓ previous / next track in queue
 * - Shift + ↑ / ↓ jump 5 tracks in queue
 * - Space play/pause (when a track is loaded)
 */
export function AudioPlayerShortcuts() {
  const {
    currentSample,
    currentTime,
    duration,
    seek,
    jumpQueue,
    toggle,
  } = useAudioPlayer();

  const stateRef = useRef({
    currentSample,
    currentTime,
    duration,
    seek,
    jumpQueue,
    toggle,
  });
  stateRef.current = {
    currentSample,
    currentTime,
    duration,
    seek,
    jumpQueue,
    toggle,
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.repeat && e.code !== "ArrowLeft" && e.code !== "ArrowRight") {
        return;
      }

      const st = stateRef.current;

      if (e.code === "Space") {
        if (!st.currentSample) return;
        e.preventDefault();
        st.toggle();
        return;
      }

      if (e.code === "ArrowLeft" || e.code === "ArrowRight") {
        if (!st.currentSample || e.shiftKey) return;
        const d = st.duration;
        if (!Number.isFinite(d) || d <= 0) return;
        const step = AUDIO_PLAYER_SEEK_STEP * d;
        const next =
          e.code === "ArrowLeft"
            ? st.currentTime - step
            : st.currentTime + step;
        st.seek(next);
        e.preventDefault();
        return;
      }

      if (e.code === "ArrowUp" || e.code === "ArrowDown") {
        if (!st.currentSample) return;
        const fast = e.shiftKey;
        const step = fast ? AUDIO_PLAYER_FAST_SKIP_STEPS : 1;
        if (e.code === "ArrowUp") {
          st.jumpQueue(-step);
        } else {
          st.jumpQueue(step);
        }
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return null;
}
