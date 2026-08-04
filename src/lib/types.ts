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
  spice_level?: number;
  is_visible?: boolean;
  created_at: string;
  updated_at: string;
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
  batch?: string;
}

export interface AdminFilters extends BookFilters {
  batch: string;
}