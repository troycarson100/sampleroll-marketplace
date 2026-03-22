export type PackEditorPack = {
  id: string;
  title: string;
  description: string;
  genre: string;
  tags: string[];
  priceCents: number;
  coverArtUrl: string | null;
  isPublished: boolean;
  sampleCount: number;
  stripePriceId: string | null;
};

export type PackEditorSample = {
  id: string;
  filename: string;
  originalFilename: string;
  fileUrl: string;
  previewUrl: string | null;
  durationSeconds: number | null;
  bpm: number | null;
  musicalKey: string | null;
  instrumentTags: string[];
  sortOrder: number;
};
