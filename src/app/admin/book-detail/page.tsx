'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminGuard from '../components/AdminGuard';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '@/lib/supabase';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

const ALL_READER_TAGS = [
  'Slow Burn', 'Slow Burn Romance', 'Enemies to Lovers', 'Found Family',
  'Morally Gray Characters', 'Strong Female Lead', 'Emotional Rollercoaster',
  'Plot Twists', 'Political Intrigue', 'Cozy Fantasy', 'Whimsical World',
  'Heartbreaking Ending', 'High Stakes', 'Dual POV', 'Single POV', 'Multi POV',
  'Fantasy Romance', 'Dark Academia', 'Gothic Atmosphere', 'Mystery', 'Adventure',
  'Banter', 'Grumpy x Sunshine', 'Marriage of Convenience', 'Fake Dating',
  'Friends to Lovers', 'Forbidden Romance', 'Rivals to Lovers', 'Dragons',
  'Vampires', 'Witches', 'Fae', 'Academy Setting', 'Slow Worldbuilding',
  'Fast-Paced', 'Character-Driven', 'Plot-Driven', 'Touch Her and Die',
  'Who Did This to You?', 'Emotional', 'Political Fantasy', 'Character Driven',
  'Cozy Fantasy', 'Dark Academia', 'Mystery', 'High Stakes',
];

interface BookDetailFields {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  synopsis: string;
  goodreads_url: string;
  goodreads_score: number;
  goodreads_ratings_count: number;
  spice_level: number;
  why_readers_love: string;
  reader_tags: string[];
  emotional_intensity: number;
  romance_level: number;
  worldbuilding_complexity: number;
  pace: number;
  humor: number;
  darkness: number;
  action: number;
  quotes: string[];
}

async function logAudit(adminHandle: string, action: string, bookTitle: string, field: string, prevVal: string, newVal: string) {
  await supabase.from('audit_logs').insert({
    admin_handle: adminHandle,
    action,
    module: 'Book Detail',
    target_ref: bookTitle,
    prev_value: prevVal,
    new_value: newVal,
    explanation: `Admin manually updated ${field} for "${bookTitle}"`,
  });
}

function getAdminHandle(): string {
  try {
    const session = JSON.parse(sessionStorage.getItem('admin_session') ?? '{}');
    return session.tiktok_handle ?? 'unknown';
  } catch { return 'unknown'; }
}

function RatingInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-44 flex-shrink-0" style={{ color: 'var(--foreground-muted)' }}>{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === n ? 0 : n)}
            className="w-7 h-7 rounded-md text-xs font-bold transition-all"
            style={{
              background: n <= value ? 'var(--primary)' : 'var(--muted)',
              color: n <= value ? '#fff' : 'var(--foreground-subtle)',
              border: `1px solid ${n <= value ? 'var(--primary)' : 'var(--border)'}`,
            }}
          >
            {n}
          </button>
        ))}
      </div>
      <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>{value}/5</span>
    </div>
  );
}

function BookDetailEditor({ book, onSaved }: { book: BookDetailFields; onSaved: () => void }) {
  const [form, setForm] = useState<BookDetailFields>({ ...book });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newQuote, setNewQuote] = useState('');
  const [newTag, setNewTag] = useState('');

  // Re-sync form when the book prop is refreshed from the server (e.g. after save)
  useEffect(() => {
    setForm({ ...book, spice_level: Number(book.spice_level) ?? 0 });
  }, [book]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const adminHandle = getAdminHandle();
      const { error } = await supabase.from('books').update({
        cover_url: form.cover_url,
        synopsis: form.synopsis,
        goodreads_url: form.goodreads_url,
        goodreads_score: form.goodreads_score,
        goodreads_ratings_count: form.goodreads_ratings_count,
        spice_level: form.spice_level,
        why_readers_love: form.why_readers_love,
        reader_tags: form.reader_tags,
        emotional_intensity: form.emotional_intensity,
        romance_level: form.romance_level,
        worldbuilding_complexity: form.worldbuilding_complexity,
        pace: form.pace,
        humor: form.humor,
        darkness: form.darkness,
        action: form.action,
        quotes: form.quotes,
      }).eq('id', form.id);

      if (error) throw error;

      await logAudit(adminHandle, 'BOOK_DETAIL_UPDATED', form.title, 'multiple fields', JSON.stringify(book), JSON.stringify(form));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleTag = (tag: string) => {
    setForm(f => ({
      ...f,
      reader_tags: f.reader_tags.includes(tag)
        ? f.reader_tags.filter(t => t !== tag)
        : [...f.reader_tags, tag],
    }));
  };

  const addQuote = () => {
    if (!newQuote.trim()) return;
    setForm(f => ({ ...f, quotes: [...f.quotes, newQuote.trim()] }));
    setNewQuote('');
  };

  const removeQuote = (i: number) => {
    setForm(f => ({ ...f, quotes: f.quotes.filter((_, idx) => idx !== i) }));
  };

  const addCustomTag = () => {
    if (!newTag.trim()) return;
    const parts = newTag.split(',').map(t => t.trim()).filter(t => t && !form.reader_tags.includes(t));
    if (parts.length === 0) return;
    setForm(f => ({ ...f, reader_tags: [...f.reader_tags, ...parts] }));
    setNewTag('');
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
    >
      {/* Book header */}
      <div className="flex items-center gap-4 p-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="relative w-12 h-16 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'var(--muted)' }}>
          <AppImage
            src={form.cover_url || '/assets/images/no_image.png'}
            alt={`Cover of ${form.title}`}
            fill
            sizes="48px"
            className="object-cover"
          />
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{form.title}</p>
          <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>{form.author}</p>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Cover Image URL */}
        <div>
          <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--foreground-subtle)' }}>
            Book Cover Image URL
          </label>
          <div className="flex gap-3 items-start">
            <div className="flex-1">
              <input
                type="url"
                value={form.cover_url}
                onChange={e => setForm(f => ({ ...f, cover_url: e.target.value }))}
                className="input-field text-sm"
                placeholder="https://example.com/book-cover.jpg"
              />
              <p className="text-xs mt-1" style={{ color: 'var(--foreground-subtle)' }}>
                Paste a direct image URL (e.g. from Goodreads or Open Library). Changes preview instantly.
              </p>
            </div>
            {form.cover_url ? (
              <div className="relative w-14 h-20 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
                <AppImage
                  src={form.cover_url}
                  alt="Cover preview"
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
            ) : null}
          </div>
        </div>

        {/* Synopsis */}
        <div>
          <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--foreground-subtle)' }}>
            Synopsis (About the Book)
          </label>
          <textarea
            rows={5}
            value={form.synopsis}
            onChange={e => setForm(f => ({ ...f, synopsis: e.target.value }))}
            className="input-field resize-none text-sm"
            placeholder="Spoiler-free synopsis (2–3 paragraphs)..."
          />
        </div>

        {/* Goodreads */}
        <div>
          <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--foreground-subtle)' }}>
            Goodreads
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--foreground-muted)' }}>Rating (0–5)</label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.01"
                value={form.goodreads_score}
                onChange={e => setForm(f => ({ ...f, goodreads_score: parseFloat(e.target.value) || 0 }))}
                className="input-field text-sm"
                placeholder="4.23"
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--foreground-muted)' }}>Ratings Count</label>
              <input
                type="number"
                min="0"
                value={form.goodreads_ratings_count}
                onChange={e => setForm(f => ({ ...f, goodreads_ratings_count: parseInt(e.target.value) || 0 }))}
                className="input-field text-sm"
                placeholder="12345"
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--foreground-muted)' }}>Goodreads URL</label>
              <input
                type="url"
                value={form.goodreads_url}
                onChange={e => setForm(f => ({ ...f, goodreads_url: e.target.value }))}
                className="input-field text-sm"
                placeholder="https://goodreads.com/book/show/..."
              />
            </div>
          </div>
        </div>

        {/* Spice Level */}
        <div>
          <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--foreground-subtle)' }}>
            Spice Level (0–5)
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setForm(f => ({ ...f, spice_level: n }))}
                className="w-8 h-8 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: n <= form.spice_level && n > 0 ? 'rgba(239,68,68,0.2)' : 'var(--muted)',
                  color: n <= form.spice_level && n > 0 ? '#ef4444' : 'var(--foreground-subtle)',
                  border: `1px solid ${n === form.spice_level ? '#ef4444' : n <= form.spice_level && n > 0 ? 'rgba(239,68,68,0.5)' : 'var(--border)'}`,
                  fontWeight: n === form.spice_level ? 700 : 400,
                }}
              >
                {n === 0 ? '—' : n % 1 !== 0 ? `½` : '🌶️'}
              </button>
            ))}
            <span className="text-xs ml-2" style={{ color: 'var(--foreground-subtle)' }}>{form.spice_level}/5</span>
          </div>
        </div>

        {/* Why Readers Love */}
        <div>
          <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--foreground-subtle)' }}>
            Why Readers Love This Book
          </label>
          <textarea
            rows={3}
            value={form.why_readers_love}
            onChange={e => setForm(f => ({ ...f, why_readers_love: e.target.value }))}
            className="input-field resize-none text-sm"
            placeholder="2–4 sentence spoiler-free summary of why readers recommend this book..."
          />
        </div>

        {/* Reader Tags */}
        <div>
          <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--foreground-subtle)' }}>
            Reader Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {ALL_READER_TAGS.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className="text-xs px-2.5 py-1 rounded-full transition-all"
                style={{
                  background: form.reader_tags.includes(tag) ? 'rgba(139,92,246,0.2)' : 'var(--muted)',
                  color: form.reader_tags.includes(tag) ? 'var(--primary-bright)' : 'var(--foreground-subtle)',
                  border: `1px solid ${form.reader_tags.includes(tag) ? 'rgba(139,92,246,0.5)' : 'var(--border)'}`,
                }}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={e => {
                const val = e.target.value;
                if (val.endsWith(',')) {
                  const parts = val.split(',').map(t => t.trim()).filter(t => t && !form.reader_tags.includes(t));
                  if (parts.length > 0) {
                    setForm(f => ({ ...f, reader_tags: [...f.reader_tags, ...parts] }));
                    setNewTag('');
                  } else {
                    setNewTag('');
                  }
                } else {
                  setNewTag(val);
                }
              }}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
              className="input-field text-sm flex-1"
              placeholder="Add custom tag... (comma-separate for multiple)"
            />
            <button type="button" onClick={addCustomTag} className="btn-ghost px-3 py-2 rounded-lg text-sm">
              + Add
            </button>
          </div>
        </div>

        {/* Reading Experience */}
        <div>
          <label className="block text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--foreground-subtle)' }}>
            Reading Experience (1–5 scale)
          </label>
          <div
            className="rounded-xl p-4 space-y-3"
            style={{ background: 'var(--background)', border: '1px solid var(--border)' }}
          >
            <RatingInput label="Emotional Intensity" value={form.emotional_intensity} onChange={v => setForm(f => ({ ...f, emotional_intensity: v }))} />
            <RatingInput label="Romance Level" value={form.romance_level} onChange={v => setForm(f => ({ ...f, romance_level: v }))} />
            <RatingInput label="Worldbuilding Complexity" value={form.worldbuilding_complexity} onChange={v => setForm(f => ({ ...f, worldbuilding_complexity: v }))} />
            <RatingInput label="Pace" value={form.pace} onChange={v => setForm(f => ({ ...f, pace: v }))} />
            <RatingInput label="Humor" value={form.humor} onChange={v => setForm(f => ({ ...f, humor: v }))} />
            <RatingInput label="Darkness" value={form.darkness} onChange={v => setForm(f => ({ ...f, darkness: v }))} />
            <RatingInput label="Action" value={form.action} onChange={v => setForm(f => ({ ...f, action: v }))} />
          </div>
        </div>

        {/* Quotes */}
        <div>
          <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--foreground-subtle)' }}>
            Quotes (Fair Use — max 2 short quotes)
          </label>
          <p className="text-xs mb-3" style={{ color: 'var(--foreground-subtle)' }}>
            Only include very short memorable quotes permissible under fair use. Leave empty if unsure.
          </p>
          <div className="space-y-2 mb-3">
            {form.quotes.map((q, i) => (
              <div key={i} className="flex items-start gap-2">
                <blockquote
                  className="flex-1 text-xs italic px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', color: 'var(--foreground-muted)' }}
                >
                  &ldquo;{q}&rdquo;
                </blockquote>
                <button
                  type="button"
                  onClick={() => removeQuote(i)}
                  className="btn-ghost p-1.5 rounded-lg flex-shrink-0"
                  style={{ color: '#ef4444' }}
                >
                  <Icon name="XMarkIcon" size={14} />
                </button>
              </div>
            ))}
          </div>
          {form.quotes.length < 2 && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newQuote}
                onChange={e => setNewQuote(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addQuote())}
                className="input-field text-sm flex-1"
                placeholder="Short memorable quote (fair use only)..."
              />
              <button type="button" onClick={addQuote} className="btn-ghost px-3 py-2 rounded-lg text-sm">
                + Add
              </button>
            </div>
          )}
        </div>

        {/* Save */}
        <div className="flex justify-end pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2"
            style={{ opacity: saving ? 0.7 : 1 }}
          >
            {saving ? (
              <><Icon name="ArrowPathIcon" size={14} className="animate-spin" /> Saving...</>
            ) : saved ? (
              <><Icon name="CheckIcon" size={14} /> Saved ✓</>
            ) : (
              <><Icon name="CloudArrowUpIcon" size={14} /> Save Changes</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function BookDetailManagementContent() {
  const [books, setBooks] = useState<BookDetailFields[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('books')
      .select('id, title, author, cover_url, synopsis, goodreads_url, goodreads_score, goodreads_ratings_count, spice_level, why_readers_love, reader_tags, emotional_intensity, romance_level, worldbuilding_complexity, pace, humor, darkness, action, quotes')
      .order('title', { ascending: true });

    setBooks((data ?? []).map(b => ({
      ...b,
      synopsis: b.synopsis ?? '',
      goodreads_url: b.goodreads_url ?? '',
      goodreads_score: b.goodreads_score ?? 0,
      goodreads_ratings_count: b.goodreads_ratings_count ?? 0,
      spice_level: Number(b.spice_level) ?? 0,
      why_readers_love: b.why_readers_love ?? '',
      reader_tags: Array.isArray(b.reader_tags) ? b.reader_tags : [],
      emotional_intensity: b.emotional_intensity ?? 0,
      romance_level: b.romance_level ?? 0,
      worldbuilding_complexity: b.worldbuilding_complexity ?? 0,
      pace: b.pace ?? 0,
      humor: b.humor ?? 0,
      darkness: b.darkness ?? 0,
      action: b.action ?? 0,
      quotes: Array.isArray(b.quotes) ? b.quotes : [],
    })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = books.filter(b => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-xl font-bold" style={{ color: 'var(--foreground)' }}>Book Detail Management</h2>
          <p className="text-xs mt-1" style={{ color: 'var(--foreground-muted)' }}>
            Manage synopsis, Goodreads info, spice level, reader tags, reading experience, and quotes for each title.
          </p>
        </div>
        <div
          className="text-xs px-3 py-1.5 rounded-lg font-semibold"
          style={{ background: 'rgba(139,92,246,0.12)', color: 'var(--primary-bright)', border: '1px solid rgba(139,92,246,0.3)' }}
        >
          {filtered.length} titles
        </div>
      </div>

      <div className="mb-5">
        <div className="relative">
          <Icon name="MagnifyingGlassIcon" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--foreground-subtle)' } as React.CSSProperties} />
          <input
            type="search"
            placeholder="Search by title or author..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9 text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
          <Icon name="BookOpenIcon" size={40} className="mx-auto mb-4" style={{ color: 'var(--foreground-subtle)' } as React.CSSProperties} />
          <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>No books found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(book => (
            <div key={book.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <button
                onClick={() => setExpandedId(expandedId === book.id ? null : book.id)}
                className="w-full flex items-center gap-4 p-4 text-left"
                style={{ background: 'var(--background-card)' }}
              >
                <div className="relative w-10 h-14 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'var(--muted)' }}>
                  <AppImage
                    src={book.cover_url || '/assets/images/no_image.png'}
                    alt={`Cover of ${book.title}`}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--foreground)' }}>{book.title}</p>
                  <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>{book.author}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {book.synopsis ? (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>Synopsis ✓</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>No Synopsis</span>
                    )}
                    {book.goodreads_score > 0 && (
                      <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>★ {book.goodreads_score.toFixed(2)}</span>
                    )}
                    {book.spice_level > 0 && (
                      <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>🌶️ {book.spice_level}/5</span>
                    )}
                    {book.reader_tags.length > 0 && (
                      <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>{book.reader_tags.length} tags</span>
                    )}
                  </div>
                </div>
                <Icon
                  name={expandedId === book.id ? 'ChevronUpIcon' : 'ChevronDownIcon'}
                  size={14}
                  style={{ color: 'var(--foreground-subtle)', flexShrink: 0 } as React.CSSProperties}
                />
              </button>

              {expandedId === book.id && (
                <div className="p-4" style={{ borderTop: '1px solid var(--border)', background: 'var(--background)' }}>
                  <BookDetailEditor book={book} onSaved={load} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminBookDetailPage() {
  return (
    <AdminGuard>
      <AdminLayout title="Book Detail Management">
        <BookDetailManagementContent />
      </AdminLayout>
    </AdminGuard>
  );
}
