export const GENRES = [
  "Hip Hop",
  "Electronic",
  "House",
  "Techno",
  "Trap",
  "R&B",
  "Pop",
  "Rock",
  "Jazz",
  "Ambient",
  "Lo-Fi",
  "Drum & Bass",
  "Experimental",
] as const;

/** Pack editor / creator flow (Phase 4) */
export const CREATOR_PACK_GENRES = [
  "Lo-Fi",
  "Trap",
  "Ambient",
  "Neo Soul",
  "Afro House",
  "Synthwave",
  "Breakbeat",
  "Downtempo",
  "Jazz",
  "Funk",
  "Soul",
  "Disco",
  "Hip-Hop",
  "Latin",
  "Other",
] as const;

export const MUSICAL_KEY_ROOTS = [
  "C",
  "C#/Db",
  "D",
  "D#/Eb",
  "E",
  "F",
  "F#/Gb",
  "G",
  "G#/Ab",
  "A",
  "A#/Bb",
  "B",
] as const;

export const PRICE_MIN_CENTS = 499;
export const PRICE_MAX_CENTS = 9999;

export const DEFAULT_CREATOR_SPLIT = 75;

export const MAX_SAMPLE_FILE_SIZE = 50 * 1024 * 1024;

export const ALLOWED_AUDIO_TYPES = [
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/mpeg",
  "audio/mp3",
  "audio/flac",
  "audio/x-flac",
  "audio/aiff",
  "audio/x-aiff",
  "audio/aac",
  "audio/ogg",
] as const;
