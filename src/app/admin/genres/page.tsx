'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminGuard from '../components/AdminGuard';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '@/lib/supabase';
import AppImage from '@/components/ui/AppImage';

// ── Genre / subgenre constants (mirrors GenresContent.tsx) ──────────────────
const GENRE_ICONS: Record<string, string> = {
  'Fantasy': '🧙',
  'Romance': '💕',
  'Thriller': '🔪',
  'Mystery': '🔍',
  'Horror': '👻',
  'Literary Fiction': '📖',
  'Historical Fiction': '🏛️',
  'Science Fiction': '🚀',
  'Classics': '📜',
  'Fiction': '📚',
  'Mythology': '⚡',
  'Nonfiction': '🎓',
  'Business': '💼',
  'Religion': '✝️',
};

const SUBGENRE_ICONS: Record<string, string> = {
  'Romantasy': '🌹',
  'Epic Fantasy': '⚔️',
  'Dark Fantasy': '🌑',
  'Urban Fantasy': '🏙️',
  'Cozy Fantasy': '🍵',
  'Historical Fantasy': '🗡️',
  'High Fantasy': '🏰',
  'Fae Fantasy': '🧚',
  'Contemporary Romance': '💌',
  'Historical Romance': '🕯️',
  'Paranormal Romance': '🌙',
  'Dark Romance': '🖤',
  'Sports Romance': '🏆',
  'Small Town Romance': '🌻',
  'Psychological Thriller': '🧠',
  'Crime Thriller': '🔫',
  'Legal Thriller': '⚖️',
  'Political Thriller': '🏛️',
  'Domestic Thriller': '🏠',
  'Cozy Mystery': '☕',
  'Detective Mystery': '🕵️',
  'Crime Mystery': '🔎',
  'Paranormal Mystery': '👁️',
  'Gothic Horror': '🦇',
  'Psychological Horror': '😱',
  'Supernatural Horror': '👁️',
  'Space Opera': '🌌',
  'Dystopian': '🏚️',
  'Cyberpunk': '🤖',
  'Hard Sci-Fi': '🔬',
  'Time Travel': '⏳',
  'Medieval': '🛡️',
  'Victorian': '🎩',
  'World War': '🎖️',
  'Ancient World': '🏺',
  'Renaissance': '🎨',
  'Contemporary': '🌆',
  'Coming of Age': '🌱',
  'Family Saga': '🏡',
  'Magical Realism': '✨',
};

const GENRE_SUBGENRES: Record<string, string[]> = {
  'Fantasy': ['Romantasy', 'Epic Fantasy', 'Dark Fantasy', 'Urban Fantasy', 'Cozy Fantasy', 'Historical Fantasy', 'High Fantasy', 'Fae Fantasy'],
  'Romance': ['Contemporary Romance', 'Historical Romance', 'Paranormal Romance', 'Dark Romance', 'Sports Romance', 'Small Town Romance'],
  'Thriller': ['Psychological Thriller', 'Crime Thriller', 'Legal Thriller', 'Political Thriller', 'Domestic Thriller'],
  'Mystery': ['Cozy Mystery', 'Detective Mystery', 'Crime Mystery', 'Paranormal Mystery'],
  'Horror': ['Gothic Horror', 'Psychological Horror', 'Supernatural Horror', 'Dark Fantasy'],
  'Science Fiction': ['Space Opera', 'Dystopian', 'Cyberpunk', 'Hard Sci-Fi', 'Time Travel'],
  'Historical Fiction': ['Medieval', 'Victorian', 'World War', 'Ancient World', 'Renaissance'],
  'Literary Fiction': ['Contemporary', 'Coming of Age', 'Family Saga', 'Magical Realism'],
};

// ── Types ────────────────────────────────────────────────────────────────────
interface GenreImageRow {
  id: string;
  genre: string;
  subgenre: string | null;
  image_url: string;
}

interface GenreImageMap {
  [key: string]: { id: string; url: string };
}

// ── Helper ───────────────────────────────────────────────────────────────────
function mapKey(genre: string, subgenre?: string | null) {
  return subgenre ? `${genre}|||${subgenre}` : genre;
}

// ── Sub-component: single editable row ───────────────────────────────────────
interface ImageRowProps {
  label: string;
  icon: string;
  imageMap: GenreImageMap;
  rowKey: string;
  genre: string;
  subgenre?: string | null;
  onSaved: (key: string, id: string, url: string) => void;
  onCleared: (key: string) => void;
}

function ImageRow({ label, icon, imageMap, rowKey, genre, subgenre, onSaved, onCleared }: ImageRowProps) {
  const existing = imageMap[rowKey];
  const [draft, setDraft] = useState(existing?.url ?? '');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  // Sync draft when imageMap changes (e.g. after initial load)
  useEffect(() => {
    setDraft(imageMap[rowKey]?.url ?? '');
  }, [imageMap, rowKey]);

  const handleSave = async () => {
    const trimmed = draft.trim();
    setSaving(true);
    setStatus('idle');

    try {
      if (trimmed === '') {
        // Clear: delete row if it exists
        if (existing?.id) {
          const { error } = await supabase.from('genre_images').delete().eq('id', existing.id);
          if (error) throw error;
        }
        onCleared(rowKey);
        setStatus('saved');
      } else {
        // Upsert
        const payload = {
          genre,
          subgenre: subgenre ?? null,
          image_url: trimmed,
          updated_at: new Date().toISOString(),
        };

        if (existing?.id) {
          const { data, error } = await supabase
            .from('genre_images')
            .update(payload)
            .eq('id', existing.id)
            .select('id, image_url')
            .single();
          if (error) throw error;
          onSaved(rowKey, data.id, data.image_url);
        } else {
          const { data, error } = await supabase
            .from('genre_images')
            .insert(payload)
            .select('id, image_url')
            .single();
          if (error) throw error;
          onSaved(rowKey, data.id, data.image_url);
        }
        setStatus('saved');
      }
    } catch {
      setStatus('error');
    } finally {
      setSaving(false);
      setTimeout(() => setStatus('idle'), 2500);
    }
  };

  const currentUrl = existing?.url ?? '';

  return (
    <div
      className="flex items-center gap-3 py-3 px-4 rounded-xl"
      style={{ background: 'rgba(251,245,236,0.45)', border: '1px solid rgba(200,164,91,0.3)' }}
    >
      {/* Preview / icon */}
      <div
        className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center"
        style={{ background: 'rgba(200,164,91,0.15)', border: '1px solid rgba(200,164,91,0.3)' }}
      >
        {currentUrl ? (
          <AppImage
            src={currentUrl}
            alt={label}
            width={40}
            height={40}
            className="object-cover w-full h-full"
          />
        ) : (
          <span className="text-xl" aria-hidden="true">{icon}</span>
        )}
      </div>

      {/* Label */}
      <span
        className="flex-shrink-0 w-40 text-sm font-medium truncate"
        style={{ color: 'var(--foreground)' }}
        title={label}
      >
        {label}
      </span>

      {/* URL input */}
      <input
        type="url"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        placeholder="Paste image URL…"
        className="flex-1 min-w-0 text-xs px-3 py-2 rounded-lg outline-none transition-all"
        style={{
          background: 'rgba(255,255,255,0.6)',
          border: '1px solid rgba(200,164,91,0.4)',
          color: 'var(--foreground)',
        }}
      />

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving || draft.trim() === (existing?.url ?? '')}
        className="flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-40"
        style={{
          background: status === 'saved' ? 'rgba(34,197,94,0.15)' : status === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(139,92,246,0.15)',
          color: status === 'saved' ? '#16a34a' : status === 'error' ? '#dc2626' : 'var(--primary-bright)',
          border: `1px solid ${status === 'saved' ? 'rgba(34,197,94,0.4)' : status === 'error' ? 'rgba(239,68,68,0.4)' : 'rgba(139,92,246,0.4)'}`,
        }}
      >
        {saving ? '…' : status === 'saved' ? '✓ Saved' : status === 'error' ? '✗ Error' : 'Save'}
      </button>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
function AdminGenresContent() {
  const [imageMap, setImageMap] = useState<GenreImageMap>({});
  const [liveGenres, setLiveGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGenres, setExpandedGenres] = useState<Set<string>>(new Set());

  // All genres = predefined + any found in books
  const allGenres = Array.from(
    new Set([...Object.keys(GENRE_ICONS), ...liveGenres])
  ).sort();

  const loadData = useCallback(async () => {
    setLoading(true);
    const [imgRes, booksRes] = await Promise.all([
      supabase.from('genre_images').select('id, genre, subgenre, image_url'),
      supabase.from('books').select('genre').not('genre', 'is', null),
    ]);

    if (imgRes.data) {
      const map: GenreImageMap = {};
      (imgRes.data as GenreImageRow[]).forEach(row => {
        const key = mapKey(row.genre, row.subgenre);
        map[key] = { id: row.id, url: row.image_url };
      });
      setImageMap(map);
    }

    if (booksRes.data) {
      const genres = Array.from(
        new Set((booksRes.data as { genre: string }[]).map(b => b.genre).filter(Boolean))
      );
      setLiveGenres(genres);
    }

    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSaved = (key: string, id: string, url: string) => {
    setImageMap(prev => ({ ...prev, [key]: { id, url } }));
  };

  const handleCleared = (key: string) => {
    setImageMap(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const toggleGenre = (genre: string) => {
    setExpandedGenres(prev => {
      const next = new Set(prev);
      if (next.has(genre)) next.delete(genre);
      else next.add(genre);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--primary)' }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}
      >
        <p className="text-sm" style={{ color: 'var(--foreground-muted)', lineHeight: '1.7' }}>
          Paste an image URL next to any genre or subgenre and click <strong>Save</strong>. The storefront genre grid will display the image instead of the default emoji. Leave a field blank to keep the emoji fallback.
        </p>
      </div>

      {/* Genre rows */}
      <div className="space-y-3">
        {allGenres.map(genre => {
          const subgenres = GENRE_SUBGENRES[genre] ?? [];
          const isExpanded = expandedGenres.has(genre);
          const genreKey = mapKey(genre);
          const hasSubgenres = subgenres.length > 0;

          return (
            <div
              key={genre}
              className="rounded-2xl overflow-hidden"
              style={{ border: '1px solid rgba(200,164,91,0.35)', background: 'rgba(251,245,236,0.25)' }}
            >
              {/* Genre header row */}
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
                    {GENRE_ICONS[genre] ?? '📚'} {genre}
                  </span>
                  {hasSubgenres && (
                    <button
                      onClick={() => toggleGenre(genre)}
                      className="ml-auto text-xs px-3 py-1 rounded-lg transition-all"
                      style={{
                        background: 'rgba(200,164,91,0.12)',
                        color: 'var(--foreground-muted)',
                        border: '1px solid rgba(200,164,91,0.3)',
                      }}
                    >
                      {isExpanded ? '▲ Hide subgenres' : `▼ ${subgenres.length} subgenres`}
                    </button>
                  )}
                </div>

                {/* Genre image row */}
                <ImageRow
                  label={`${genre} (genre)`}
                  icon={GENRE_ICONS[genre] ?? '📚'}
                  imageMap={imageMap}
                  rowKey={genreKey}
                  genre={genre}
                  subgenre={null}
                  onSaved={handleSaved}
                  onCleared={handleCleared}
                />
              </div>

              {/* Subgenre rows (collapsible) */}
              {hasSubgenres && isExpanded && (
                <div
                  className="px-3 pb-3 space-y-2"
                  style={{ borderTop: '1px solid rgba(200,164,91,0.2)' }}
                >
                  <p className="text-xs pt-3 pb-1 font-semibold uppercase tracking-widest" style={{ color: 'var(--foreground-subtle)' }}>
                    Subgenres
                  </p>
                  {subgenres.map(sg => (
                    <ImageRow
                      key={sg}
                      label={sg}
                      icon={SUBGENRE_ICONS[sg] ?? GENRE_ICONS[genre] ?? '📚'}
                      imageMap={imageMap}
                      rowKey={mapKey(genre, sg)}
                      genre={genre}
                      subgenre={sg}
                      onSaved={handleSaved}
                      onCleared={handleCleared}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminGenresPage() {
  return (
    <AdminGuard>
      <AdminLayout title="Genre Management">
        <AdminGenresContent />
      </AdminLayout>
    </AdminGuard>
  );
}
