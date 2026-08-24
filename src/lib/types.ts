export type BookStatus = 'Pre-order' | 'On Hand' | 'Sold Out';
export type BookFormat = 'Paperback' | 'Hardcover' | 'Special Edition' | 'Omnibus' | 'Bundle';

export interface Book {
  id: string;
  sku: string;
  title: string;
  author: string;
  genre: string;
  subgenre: string;
  series: string;
  series_order: number | null;
  format: BookFormat;
  edition: string;
  final_srp: number;
  batch: string;
  arrival_date: string | null;
  inventory: number;
  reserved: number;
  synopsis: string;
  cover_url: string;
  goodreads_url?: string;
  goodreads_score?: number;
  goodreads_ratings_count?: number;
  spice_level?: number;
  gore_level?: number;
  is_visible?: boolean;
  is_price_visible?: boolean;
  is_eta_visible?: boolean;
  visibility?: string;
  created_at: string;
  updated_at: string;
  // Price fields
  preorder_price?: number;
  onhand_price?: number | null;
  // Extended enrichment fields
  reader_tags?: string[];
  why_readers_love?: string;
  emotional_intensity?: number;
  romance_level?: number;
  worldbuilding_complexity?: number;
  pace?: number;
  humor?: number;
  darkness?: number;
  action?: number;
  quotes?: string[];
  reading_age?: string;
  content_warnings?: string;
  // Computed fields
  available?: number;
  status?: BookStatus;
}

export interface Bundle {
  id: string;
  name: string;
  description: string;
  cover_url: string;
  final_srp: number;
  books: Book[];
  status: BookStatus;
  created_at: string;
}

export interface BookFilters {
  search: string;
  genre: string;
  subgenre: string;
  format: string;
  status: string;
  series: string;
  author?: string;
  batch?: string;
  source?: string;
}

export interface AdminFilters extends BookFilters {
  batch: string;
}

export interface SupportTicket {
  id: string;
  name: string;
  tiktok_handle: string;
  subject: string;
  message: string;
  status: 'New' | 'Open' | 'Waiting for Customer' | 'Resolved' | 'Closed';
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

export interface OnHandItem {
  id: string;
  sku: string;
  title: string;
  author: string;
  genre: string;
  subgenre: string;
  series: string;
  series_order: number | null;
  format: BookFormat;
  edition: string;
  final_srp: number;
  inventory: number;
  synopsis: string;
  cover_url: string;
  goodreads_url?: string;
  goodreads_score?: number;
  spice_level?: number;
  gore_level?: number;
  is_visible: boolean;
  is_price_visible: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}