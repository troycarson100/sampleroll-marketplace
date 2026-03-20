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
