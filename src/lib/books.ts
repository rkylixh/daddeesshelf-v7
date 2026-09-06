import { Book, BookFilters } from './types';
import { createBrowserClient } from '@supabase/ssr';

function getClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function computeStatus(book: Partial<Book> & { visibility?: string; ordered?: number }): Book['status'] {
  // If visibility is explicitly 'Reserved', treat as Sold Out
  if (book.visibility === 'Reserved') return 'Sold Out';
  // Sold out when all copies are reserved OR ordered (reserved + ordered >= total copies)
  const inventory = book.inventory ?? 0;
  const reserved = book.reserved ?? 0;
  const ordered = book.ordered ?? 0;
  if ((reserved + ordered) >= inventory && inventory > 0) return 'Sold Out';
  const available = inventory - reserved - ordered;
  if (book.arrival_date && new Date(book.arrival_date) > new Date()) return 'Pre-order';
  if (available > 0) return 'On Hand';
  return 'Sold Out';
}

/** Admin Price toggle — default true when flag is missing. */
export function isPriceVisible(book: { is_price_visible?: boolean }): boolean {
  return book.is_price_visible !== false;
}

/** Admin ETA toggle — default true when flag is missing. */
export function isEtaVisible(book: { is_eta_visible?: boolean }): boolean {
  return book.is_eta_visible !== false;
}

/** Format storefront price or "Price TBA" when hidden. */
export function formatBookPrice(book: { is_price_visible?: boolean; final_srp?: number }): string {
  if (!isPriceVisible(book)) return 'Price TBA';
  return `₱${Number(book.final_srp ?? 0).toLocaleString()}`;
}

/**
 * Whether a title can be added to cart / preordered.
 * Price must be visible; sold-out / zero stock cannot be purchased.
 */
export function canPurchase(book: Book): boolean {
  if (!isPriceVisible(book)) return false;
  if (book.status === 'Sold Out') return false;
  const available = Math.max(0, (book.inventory ?? 0) - (book.reserved ?? 0) - (book.ordered ?? 0));
  return available > 0;
}

/** Re-export mapper for homepage / local selects so flags never drift. */
export function mapBookFromRow(row: Record<string, unknown>): Book {
  return mapRow(row);
}

function mapRow(row: Record<string, unknown>): Book {
  const available = Number(row.inventory ?? 0) - Number(row.reserved ?? 0) - Number(row.ordered ?? 0);
  const status = computeStatus({
    inventory: Number(row.inventory ?? 0),
    reserved: Number(row.reserved ?? 0),
    ordered: Number(row.ordered ?? 0),
    arrival_date: row.arrival_date ? String(row.arrival_date) : null,
    visibility: row.visibility ? String(row.visibility) : undefined,
  });

  const preorderPrice = row.preorder_price != null ? Number(row.preorder_price) : Number(row.final_srp ?? 0);
  const onhandPrice = row.onhand_price != null ? Number(row.onhand_price) : null;

  // For On Hand books, prefer onhand_price; for all others use preorder_price
  // Fall back to preorder_price if onhand_price is not set
  let displayPrice: number;
  if (status === 'On Hand' && onhandPrice != null && onhandPrice > 0) {
    displayPrice = onhandPrice;
  } else {
    displayPrice = preorderPrice;
  }

  return {
    id: String(row.id ?? ''),
    sku: String(row.sku ?? ''),
    title: String(row.title ?? ''),
    author: String(row.author ?? ''),
    genre: String(row.genre ?? ''),
    subgenre: String(row.subgenre ?? ''),
    series: String(row.series ?? ''),
    series_order: row.series_order != null ? Number(row.series_order) : null,
    format: (row.format as Book['format']) ?? 'Paperback',
    edition: String(row.edition ?? ''),
    final_srp: displayPrice,
    preorder_price: preorderPrice,
    onhand_price: onhandPrice,
    batch: String(row.batch ?? ''),
    arrival_date: row.arrival_date ? String(row.arrival_date) : null,
    inventory: Number(row.inventory ?? 0),
    reserved: Number(row.reserved ?? 0),
    ordered: Number(row.ordered ?? 0),
    synopsis: String(row.synopsis ?? ''),
    cover_url: String(row.cover_url ?? ''),
    goodreads_url: row.goodreads_url ? String(row.goodreads_url) : (row.goodreads_link ? String(row.goodreads_link) : undefined),
    goodreads_score: row.goodreads_score != null ? Number(row.goodreads_score) : undefined,
    spice_level: row.spice_level != null ? Number(row.spice_level) : (row.spice_rating != null ? Number(row.spice_rating) : undefined),
    gore_level: row.gore_level != null ? Number(row.gore_level) : 0,
    is_visible: row.is_visible !== false,
    is_price_visible: row.is_price_visible !== false,
    is_eta_visible: row.is_eta_visible !== false,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
    available,
    status,
    // Extended fields
    goodreads_ratings_count: row.goodreads_ratings_count != null ? Number(row.goodreads_ratings_count) : 0,
    reader_tags: Array.isArray(row.reader_tags) ? row.reader_tags as string[] : [],
    why_readers_love: row.why_readers_love ? String(row.why_readers_love) : '',
    emotional_intensity: row.emotional_intensity != null ? Number(row.emotional_intensity) : 0,
    romance_level: row.romance_level != null ? Number(row.romance_level) : 0,
    worldbuilding_complexity: row.worldbuilding_complexity != null ? Number(row.worldbuilding_complexity) : 0,
    pace: row.pace != null ? Number(row.pace) : 0,
    humor: row.humor != null ? Number(row.humor) : 0,
    darkness: row.darkness != null ? Number(row.darkness) : 0,
    action: row.action != null ? Number(row.action) : 0,
    quotes: Array.isArray(row.quotes) ? row.quotes as string[] : [],
    reading_age: row.reading_age ? String(row.reading_age) : '',
    content_warnings: row.content_warnings ? String(row.content_warnings) : '',
    visibility: row.visibility ? String(row.visibility) : 'Available',
  } as Book & Record<string, unknown>;
}

export async function getBooks(filters?: Partial<BookFilters>): Promise<Book[]> {
  const supabase = getClient();
  let query = supabase.from('books').select('*').eq('is_visible', true).order('created_at', { ascending: false });

  if (filters?.search) {
    const q = filters.search;
    query = query.or(`title.ilike.%${q}%,author.ilike.%${q}%,sku.ilike.%${q}%,genre.ilike.%${q}%,subgenre.ilike.%${q}%,series.ilike.%${q}%`);
  }
  if (filters?.genre) query = query.eq('genre', filters.genre);
  if (filters?.subgenre) query = query.eq('subgenre', filters.subgenre);
  if (filters?.format) query = query.eq('format', filters.format);
  if (filters?.series) query = query.eq('series', filters.series);
  if (filters?.batch) query = query.eq('batch', filters.batch);

  const { data, error } = await query;
  if (error) {
    console.error('getBooks error:', error);
    return [];
  }
  const books = (data ?? []).map(mapRow);
  if (filters?.status) return books.filter(b => b.status === filters.status);
  return books;
}

export async function getAllBooksAdmin(filters?: Partial<BookFilters>): Promise<Book[]> {
  const supabase = getClient();
  let query = supabase.from('books').select('*').order('created_at', { ascending: false });

  if (filters?.search) {
    const q = filters.search;
    query = query.or(`title.ilike.%${q}%,author.ilike.%${q}%,sku.ilike.%${q}%,genre.ilike.%${q}%,subgenre.ilike.%${q}%`);
  }
  if (filters?.genre) query = query.eq('genre', filters.genre);
  if (filters?.format) query = query.eq('format', filters.format);
  if (filters?.batch) query = query.eq('batch', filters.batch);

  const { data, error } = await query;
  if (error) {
    console.error('getAllBooksAdmin error:', error);
    return [];
  }
  const books = (data ?? []).map(mapRow);
  if (filters?.status) return books.filter(b => b.status === filters.status);
  return books;
}

export async function getBookById(id: string): Promise<Book | null> {
  const supabase = getClient();
  const { data, error } = await supabase.from('books').select('*').eq('id', id).single();
  if (error || !data) return null;
  return mapRow(data as Record<string, unknown>);
}

export async function getPreorderBooks(): Promise<Book[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('is_visible', true)
    .order('arrival_date', { ascending: true });
  if (error) return [];
  return (data ?? []).map(mapRow).filter(b => b.status === 'Pre-order');
}

export async function createBook(data: Omit<Book, 'id' | 'created_at' | 'updated_at' | 'available' | 'status'>): Promise<Book | null> {
  const supabase = getClient();
  // Strip computed/virtual fields that don't exist as DB columns
  const { available: _a, status: _s, ...insertData } = data as Record<string, unknown>;
  const { data: row, error } = await supabase.from('books').insert(insertData).select().single();
  if (error) { console.error('createBook error:', error); return null; }
  return mapRow(row as Record<string, unknown>);
}

export async function updateBook(id: string, data: Partial<Book>): Promise<Book | null> {
  const supabase = getClient();
  // Strip computed/virtual fields that don't exist as DB columns
  const { available: _a, status: _s, id: _id, created_at: _c, updated_at: _u, ...updateData } = data as Record<string, unknown>;
  const { data: row, error } = await supabase.from('books').update(updateData).eq('id', id).select().single();
  if (error) { console.error('updateBook error:', error); return null; }
  return mapRow(row as Record<string, unknown>);
}

export async function deleteBook(id: string): Promise<void> {
  const supabase = getClient();
  const { error } = await supabase.from('books').delete().eq('id', id);
  if (error) console.error('deleteBook error:', error);
}

export async function bulkUpdateBooks(ids: string[], data: Partial<Book>): Promise<void> {
  const supabase = getClient();
  const { error } = await supabase.from('books').update(data).in('id', ids);
  if (error) console.error('bulkUpdateBooks error:', error);
}

export async function getDistinctGenres(): Promise<string[]> {
  const supabase = getClient();
  const { data } = await supabase.from('books').select('genre').eq('is_visible', true);
  if (!data) return [];
  return [...new Set(data.map((r: Record<string, unknown>) => String(r.genre)).filter(Boolean))].sort();
}

export async function getDistinctBatches(): Promise<string[]> {
  const supabase = getClient();
  const { data } = await supabase.from('books').select('batch').eq('is_visible', true);
  if (!data) return [];
  return [...new Set(data.map((r: Record<string, unknown>) => String(r.batch)).filter(Boolean))].sort();
}