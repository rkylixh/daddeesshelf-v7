'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminGuard from '../components/AdminGuard';
import AdminLayout from '../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import Icon from '@/components/ui/AppIcon';
import AdminAnnouncementsContent from '../announcements/components/AdminAnnouncementsContent';

interface HeroSettings {
  eyebrow: string;
  tagline: string;
}

interface HowItWorksStep {
  step: string;
  icon: string;
  title: string;
  desc: string;
}

interface SectionVisibility {
  best_sellers: boolean;
  current_batch: boolean;
  booktok_favorites: boolean;
  featured_books: boolean;
  fresh_picks: boolean;
  how_it_works: boolean;
  faqs: boolean;
}

const DEFAULT_HERO: HeroSettings = {
  eyebrow: '❧ Discovering Your Next Favorite Story ❧',
  tagline: 'Your curated bookshop for pre-orders and on-hand titles.',
};

const DEFAULT_STEPS: HowItWorksStep[] = [
  { step: '1', icon: 'BookOpenIcon', title: 'Browse & Select', desc: 'Choose titles from the current import batch' },
  { step: '2', icon: 'ShoppingCartIcon', title: 'Add to Cart', desc: 'Add multiple books to your preorder cart' },
  { step: '3', icon: 'QrCodeIcon', title: 'Pay via GCash', desc: 'Scan the QR code and send payment' },
  { step: '4', icon: 'CheckCircleIcon', title: 'Track Your Order', desc: 'Use your PIN to check status anytime' },
];

const DEFAULT_VISIBILITY: SectionVisibility = {
  best_sellers: true,
  current_batch: true,
  booktok_favorites: true,
  featured_books: true,
  fresh_picks: true,
  how_it_works: true,
  faqs: true,
};

type Tab = 'hero' | 'how_it_works' | 'announcements' | 'visibility';

function HomepageContentEditor() {
  const [activeTab, setActiveTab] = useState<Tab>('hero');
  const [hero, setHero] = useState<HeroSettings>(DEFAULT_HERO);
  const [steps, setSteps] = useState<HowItWorksStep[]>(DEFAULT_STEPS);
  const [visibility, setVisibility] = useState<SectionVisibility>(DEFAULT_VISIBILITY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('homepage_settings').select('*');
      if (data) {
        for (const row of data) {
          if (row.key === 'hero') setHero(row.value as HeroSettings);
          if (row.key === 'how_it_works') setSteps(row.value as HowItWorksStep[]);
          if (row.key === 'section_visibility') setVisibility(row.value as SectionVisibility);
        }
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveHero = async () => {
    setSaving(true);
    setMessage('');
    try {
      await supabase.from('homepage_settings').upsert({ key: 'hero', value: hero, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      setMessage('Hero settings saved!');
    } catch { setMessage('Failed to save.'); }
    setSaving(false);
  };

  const saveSteps = async () => {
    setSaving(true);
    setMessage('');
    try {
      await supabase.from('homepage_settings').upsert({ key: 'how_it_works', value: steps, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      setMessage('Steps saved!');
    } catch { setMessage('Failed to save.'); }
    setSaving(false);
  };

  const saveVisibility = async () => {
    setSaving(true);
    setMessage('');
    try {
      await supabase.from('homepage_settings').upsert({ key: 'section_visibility', value: visibility, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      setMessage('Visibility settings saved!');
    } catch { setMessage('Failed to save.'); }
    setSaving(false);
  };

  const updateStep = (idx: number, field: keyof HowItWorksStep, value: string) => {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'hero', label: 'Hero Section', icon: 'HomeIcon' },
    { key: 'how_it_works', label: 'How It Works', icon: 'ListBulletIcon' },
    { key: 'announcements', label: 'Announcements', icon: 'MegaphoneIcon' },
    { key: 'visibility', label: 'Section Visibility', icon: 'EyeIcon' },
  ];

  const SECTION_LABELS: Record<keyof SectionVisibility, string> = {
    best_sellers: 'Best Sellers',
    current_batch: 'Current Import Batch',
    booktok_favorites: 'BookTok Favorites',
    featured_books: 'Featured Books',
    fresh_picks: 'Fresh Picks',
    how_it_works: 'How It Works',
    faqs: 'FAQ Preview',
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold" style={{ color: 'var(--foreground)' }}>Homepage Content</h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--foreground-muted)' }}>Edit hero text, how-it-works steps, announcements, and section visibility.</p>
      </div>

      {message && (
        <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setMessage(''); }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all rounded-t-lg"
            style={activeTab === tab.key
              ? { background: 'var(--background-card)', color: 'var(--primary-bright)', borderBottom: '2px solid var(--primary-bright)', marginBottom: '-1px' }
              : { color: 'var(--foreground-muted)' }
            }
          >
            <Icon name={tab.icon as 'HomeIcon'} size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Hero Tab */}
      {activeTab === 'hero' && (
        <div className="rounded-xl p-6 space-y-4" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
          <h3 className="font-display text-base font-bold" style={{ color: 'var(--foreground)' }}>Hero Section</h3>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground-muted)' }}>Eyebrow Text</label>
            <input
              type="text"
              value={hero.eyebrow}
              onChange={e => setHero(h => ({ ...h, eyebrow: e.target.value }))}
              className="input-field text-sm"
              placeholder="❧ Discovering Your Next Favorite Story ❧"
            />
            <p className="text-xs mt-1" style={{ color: 'var(--foreground-subtle)' }}>Small text displayed above the main heading in the hero.</p>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground-muted)' }}>Tagline</label>
            <textarea
              rows={2}
              value={hero.tagline}
              onChange={e => setHero(h => ({ ...h, tagline: e.target.value }))}
              className="input-field text-sm resize-none"
              placeholder="Your curated bookshop..."
            />
            <p className="text-xs mt-1" style={{ color: 'var(--foreground-subtle)' }}>Subtitle shown below the main heading.</p>
          </div>
          <button onClick={saveHero} disabled={saving} className="btn-primary text-sm px-6 py-2.5" style={{ opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : 'Save Hero Settings'}
          </button>
        </div>
      )}

      {/* How It Works Tab */}
      {activeTab === 'how_it_works' && (
        <div className="rounded-xl p-6 space-y-5" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
          <h3 className="font-display text-base font-bold" style={{ color: 'var(--foreground)' }}>How Preordering Works — Steps</h3>
          {steps.map((step, idx) => (
            <div key={idx} className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--primary-bright)' }}>Step {step.step}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--foreground-muted)' }}>Title</label>
                  <input
                    type="text"
                    value={step.title}
                    onChange={e => updateStep(idx, 'title', e.target.value)}
                    className="input-field text-sm py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--foreground-muted)' }}>Description</label>
                  <input
                    type="text"
                    value={step.desc}
                    onChange={e => updateStep(idx, 'desc', e.target.value)}
                    className="input-field text-sm py-2"
                  />
                </div>
              </div>
            </div>
          ))}
          <button onClick={saveSteps} disabled={saving} className="btn-primary text-sm px-6 py-2.5" style={{ opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : 'Save Steps'}
          </button>
        </div>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <AdminAnnouncementsContent />
      )}

      {/* Visibility Tab */}
      {activeTab === 'visibility' && (
        <div className="rounded-xl p-6 space-y-4" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
          <h3 className="font-display text-base font-bold" style={{ color: 'var(--foreground)' }}>Section Visibility</h3>
          <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Toggle which sections appear on the homepage.</p>
          <div className="space-y-3">
            {(Object.keys(SECTION_LABELS) as (keyof SectionVisibility)[]).map(key => (
              <div key={key} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid var(--border)' }}>
                <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{SECTION_LABELS[key]}</span>
                <button
                  onClick={() => setVisibility(v => ({ ...v, [key]: !v[key] }))}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                  style={visibility[key]
                    ? { background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }
                    : { background: 'var(--muted)', color: 'var(--foreground-muted)', border: '1px solid var(--border)' }
                  }
                >
                  {visibility[key] ? 'Visible' : 'Hidden'}
                </button>
              </div>
            ))}
          </div>
          <button onClick={saveVisibility} disabled={saving} className="btn-primary text-sm px-6 py-2.5" style={{ opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : 'Save Visibility'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminHomepagePage() {
  return (
    <AdminGuard>
      <AdminLayout title="Homepage Content">
        <HomepageContentEditor />
      </AdminLayout>
    </AdminGuard>
  );
}
