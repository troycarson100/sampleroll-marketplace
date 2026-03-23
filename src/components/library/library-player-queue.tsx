"use client";

import { useEffect } from "react";
import { useAudioPlayer } from "@/components/audio/audio-player-context";

type Track = {
  id: string;
  previewUrl: string;
  label: string;
  source: "pack_demo";
  packId: string;
  coverUrl: string | null;
  subtitle: string;
  bpm: null;
  key: null;
};

export function LibraryPlayerQueue({ tracks }: { tracks: Track[] }) {
  const { setQueue } = useAudioPlayer();

  useEffect(() => {
    setQueue(tracks);
  }, [setQueue, tracks]);

  return null;
}
