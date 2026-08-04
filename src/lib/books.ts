import { Book, BookFilters } from './types';
import { createBrowserClient } from '@supabase/ssr';

function getClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function computeStatus(book: Partial<Book>): Book['status'] {
  const available = (book.inventory ?? 0) - (book.reserved ?? 0);
  if (book.arrival_date && new Date(book.arrival_date) > new Date()) return 'Pre-order';
  if (available > 0) return 'On Hand';
  return 'Sold Out';
}

function mapRow(row: Record<string, unknown>): Book {
  const available = Number(row.inventory ?? 0) - Number(row.reserved ?? 0);
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
    final_srp: Number(row.final_srp ?? 0),
    batch: String(row.batch ?? ''),
    arrival_date: row.arrival_date ? String(row.arrival_date) : null,
    inventory: Number(row.inventory ?? 0),
    reserved: Number(row.reserved ?? 0),
    synopsis: String(row.synopsis ?? ''),
    cover_url: String(row.cover_url ?? ''),
    goodreads_url: row.goodreads_url ? String(row.goodreads_url) : undefined,
    goodreads_score: row.goodreads_score != null ? Number(row.goodreads_score) : undefined,
    spice_level: row.spice_level != null ? Number(row.spice_level) : undefined,
    is_visible: row.is_visible !== false,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
    available,
    status: computeStatus({
      inventory: Number(row.inventory ?? 0),
      reserved: Number(row.reserved ?? 0),
      arrival_date: row.arrival_date ? String(row.arrival_date) : null,
    }),
  };
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
  const { data: row, error } = await supabase.from('books').insert(data).select().single();
  if (error) { console.error('createBook error:', error); return null; }
  return mapRow(row as Record<string, unknown>);
}

export async function updateBook(id: string, data: Partial<Book>): Promise<Book | null> {
  const supabase = getClient();
  const { data: row, error } = await supabase.from('books').update(data).eq('id', id).select().single();
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
  const { data } = await supabase.from('books').select('batch');
  if (!data) return [];
  return [...new Set(data.map((r: Record<string, unknown>) => String(r.batch)).filter(Boolean))].sort();
}