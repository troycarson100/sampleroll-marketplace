/** Row in `profiles_marketplace` */
export interface ProfileMarketplace {
  id: string;
  is_creator: boolean;
  creator_display_name: string | null;
  creator_bio: string | null;
  creator_avatar_url: string | null;
  custom_split_percentage: number | null;
  paypal_email: string | null;
  created_at: string;
  updated_at: string;
}

/** Row in `sample_packs` */
export interface SamplePack {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  genre: string;
  tags: string[];
  cover_art_url: string | null;
  price_cents: number;
  stripe_price_id: string | null;
  sample_count: number;
  total_sales: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

/** Row in `individual_samples` */
export interface IndividualSample {
  id: string;
  pack_id: string;
  filename: string;
  original_filename: string;
  file_url: string;
  preview_url: string | null;
  duration_seconds: number | null;
  bpm: number | null;
  musical_key: string | null;
  instrument_tags: string[];
  genre_tags: string[];
  sort_order: number;
  created_at: string;
}

/** @deprecated Prefer `IndividualSample` (matches table name) */
export type Sample = IndividualSample;

/** Row in `user_purchases` */
export interface UserPurchase {
  id: string;
  user_id: string;
  pack_id: string;
  stripe_payment_intent_id: string;
  amount_cents: number;
  created_at: string;
}

/** Row in `creator_earnings` */
export interface CreatorEarning {
  id: string;
  creator_id: string;
  pack_id: string;
  purchase_id: string;
  sale_amount_cents: number;
  creator_share_cents: number;
  platform_share_cents: number;
  split_percentage: number;
  is_paid_out: boolean;
  paid_out_at: string | null;
  created_at: string;
}
