'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/AppIcon';
import { supabase } from '@/lib/supabase';

// ── Types ──────────────────────────────────────────────────
interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  sort_order: number;
  is_visible: boolean;
  is_featured: boolean;
}

interface ReaderQuestion {
  id: string;
  customer_name: string;
  tiktok_handle: string;
  comment: string;
  admin_reply: string;
  created_at: string;
}

// ── FAQ Item ───────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200"
      style={{ background: 'var(--background-card)', border: `1px solid ${open ? 'rgba(139,92,246,0.4)' : 'var(--border)'}` }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold leading-snug" style={{ color: 'var(--foreground)' }}>{q}</span>
        <span
          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all"
          style={{ background: open ? 'rgba(139,92,246,0.2)' : 'var(--muted)', color: 'var(--primary-bright)' }}
        >
          <Icon name={open ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={14} />
        </span>
      </button>
      {open && (
        <div className="px-5 pb-5">
          <div className="w-full h-px mb-4" style={{ background: 'var(--border)' }} />
          <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>{a}</p>
        </div>
      )}
    </div>
  );
}

// ── Reader Questions Section ───────────────────────────────
function ReaderQuestionsSection() {
  const [questions, setQuestions] = useState<ReaderQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ tiktok: '', name: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from('reader_comments')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false });
        setQuestions((data ?? []) as ReaderQuestion[]);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tiktok.trim()) { setError('TikTok Handle is required.'); return; }
    if (!form.comment.trim()) { setError('Question is required.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const { error: err } = await supabase.from('reader_comments').insert({
        tiktok_handle: form.tiktok.trim(),
        customer_name: form.name.trim(),
        comment: form.comment.trim(),
        status: 'Pending Review',
        is_published: false,
      });
      if (err) throw err;
      setSubmitted(true);
      setForm({ tiktok: '', name: '', comment: '' });
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="mt-16 max-w-3xl mx-auto">
      {/* Section header */}
      <div className="text-center mb-8">
        <div className="celestial-divider mb-6">
          <span className="text-sm tracking-widest">✦ Community ✦</span>
        </div>
        <h2 className="font-display text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
          Reader Questions &amp; Inquiries
        </h2>
        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
          Have a question not covered above? Submit it below and we&apos;ll answer publicly so everyone benefits.
        </p>
      </div>

      {/* Moderation disclaimer */}
      <div
        className="rounded-xl p-4 mb-8 flex gap-3"
        style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}
      >
        <span className="text-lg flex-shrink-0" aria-hidden="true">✦</span>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
          <strong style={{ color: 'var(--primary-bright)' }}>Moderation Notice:</strong>{' '}
          To keep our community welcoming and helpful, every public question is reviewed before it appears on the website. Once approved, our team may also publish an official response so future readers can benefit from the same answer.
        </p>
      </div>

      {/* Published questions */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
        </div>
      ) : questions.length > 0 ? (
        <div className="space-y-4 mb-10">
          {questions.map(q => (
            <div
              key={q.id}
              className="rounded-xl p-5"
              style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs font-semibold" style={{ color: 'var(--primary-bright)' }}>{q.tiktok_handle}</span>
                {q.customer_name && (
                  <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>· {q.customer_name}</span>
                )}
                <span className="text-xs ml-auto" style={{ color: 'var(--foreground-subtle)' }}>{formatDate(q.created_at)}</span>
              </div>
              <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--foreground-muted)' }}>{q.comment}</p>
              {q.admin_reply && (
                <div
                  className="rounded-lg p-3 mt-2"
                  style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}
                >
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--primary-bright)' }}>
                    ✦ Daddee&apos;s Shelf replied:
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>{q.admin_reply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 mb-8" style={{ color: 'var(--foreground-subtle)' }}>
          <p className="text-sm">No approved questions yet. Be the first to ask!</p>
        </div>
      )}

      {/* Question submission form */}
      <div
        className="rounded-2xl p-6"
        style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
      >
        <h3 className="font-display text-base font-bold mb-4" style={{ color: 'var(--foreground)' }}>
          Submit a Question
        </h3>
        {submitted ? (
          <div className="text-center py-6">
            <span className="text-3xl mb-3 block" aria-hidden="true">✦</span>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--primary-bright)' }}>Question Submitted!</p>
            <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
              Your question is pending review and will appear here once approved by our team.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="btn-secondary text-xs px-4 py-2 mt-4"
            >
              Submit Another Question
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                  TikTok Handle <span style={{ color: 'var(--primary)' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.tiktok}
                  onChange={e => setForm(f => ({ ...f, tiktok: e.target.value }))}
                  className="input-field text-sm"
                  placeholder="@yourtiktok"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                  Display Name <span style={{ color: 'var(--foreground-subtle)' }}>(Optional)</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input-field text-sm"
                  placeholder="Your display name"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
                Your Question <span style={{ color: 'var(--primary)' }}>*</span>
              </label>
              <textarea
                required
                rows={4}
                value={form.comment}
                onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                className="input-field text-sm resize-none"
                placeholder="Ask a question about preorders, shipping, payment..."
              />
            </div>
            {error && <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-sm px-6 py-2.5"
              style={{ opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? 'Submitting...' : 'Submit Question ✦'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Main FAQ Page ──────────────────────────────────────────
export default function FAQsContent() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All Questions');
  const [search, setSearch] = useState('');

  const loadFaqs = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('faqs')
        .select('*')
        .eq('is_visible', true)
        .order('is_featured', { ascending: false })
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      setFaqs((data ?? []) as FAQ[]);
    } catch {
      setFaqs([]);
    } finally {
      setLoadingFaqs(false);
    }
  }, []);

  useEffect(() => { loadFaqs(); }, [loadFaqs]);

  // Dynamic categories from Supabase data
  const categories = useMemo(() => {
    const cats = [...new Set(faqs.map(f => f.category).filter(Boolean))];
    return ['All Questions', ...cats];
  }, [faqs]);

  // Featured / Most Popular questions
  const featuredFaqs = useMemo(() => faqs.filter(f => f.is_featured), [faqs]);

  const filtered = useMemo(() => {
    let list = faqs;
    if (activeCategory !== 'All Questions') list = list.filter(f => f.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(f =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [faqs, activeCategory, search]);

  return (
    <div className="content-wrapper py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)', letterSpacing: '0.2em' }}>
          ✦ Help Center ✦
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
          Pre-Order Frequently Asked Questions
        </h1>
        <p className="text-sm max-w-lg mx-auto" style={{ color: 'var(--foreground-muted)', lineHeight: '1.7' }}>
          Everything you need to know about preordering, shipping, and payment at Daddee&apos;s Shelf.
        </p>
      </div>

      {loadingFaqs ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
        </div>
      ) : (
        <>
          {/* Most Popular Questions */}
          {featuredFaqs.length > 0 && (
            <div className="max-w-3xl mx-auto mb-12">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-lg" aria-hidden="true">⭐</span>
                <h2 className="font-display text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                  Most Popular Questions
                </h2>
              </div>
              <div className="space-y-3">
                {featuredFaqs.map(faq => (
                  <FAQItem key={`featured-${faq.id}`} q={faq.question} a={faq.answer} />
                ))}
              </div>
            </div>
          )}

          {/* FAQ Search */}
          <div className="max-w-xl mx-auto mb-8 relative">
            <Icon
              name="MagnifyingGlassIcon"
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--foreground-subtle)' } as React.CSSProperties}
            />
            <input
              type="search"
              placeholder="Search questions, answers, categories..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-11 py-3 text-sm"
              style={{ borderRadius: '9999px' }}
            />
          </div>

          {/* Category tabs — dynamic from Supabase */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="text-xs px-4 py-2 rounded-full font-semibold transition-all"
                style={{
                  background: activeCategory === cat ? 'linear-gradient(135deg, #8b5cf6, #4f46e5)' : 'var(--muted)',
                  color: activeCategory === cat ? '#fff' : 'var(--foreground-muted)',
                  border: `1px solid ${activeCategory === cat ? 'transparent' : 'var(--border)'}`,
                  boxShadow: activeCategory === cat ? '0 4px 15px rgba(139,92,246,0.3)' : 'none',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* FAQ list */}
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-4xl mb-4 block">✦</span>
              <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                {search ? `No questions found for "${search}". Try a different search.` : 'No questions in this category yet.'}
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-3">
              {filtered.map(faq => (
                <FAQItem key={faq.id} q={faq.question} a={faq.answer} />
              ))}
            </div>
          )}

          {/* Contact CTA */}
          <div
            className="mt-16 rounded-2xl p-8 text-center max-w-2xl mx-auto"
            style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(79,70,229,0.08))', border: '1px solid rgba(139,92,246,0.25)' }}
          >
            <span className="text-3xl mb-4 block" aria-hidden="true">✦</span>
            <h2 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              Still have questions?
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--foreground-muted)' }}>
              We&apos;re happy to help! Reach out via our contact page or message us on TikTok.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="/contact" className="btn-primary text-sm px-8 py-3 inline-block">
                Contact Us
              </a>
              <a href="https://tiktok.com/@daddees.shelf" target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm px-8 py-3 inline-block">
                @daddees.shelf on TikTok
              </a>
            </div>
          </div>

          {/* Reader Questions & Inquiries */}
          <ReaderQuestionsSection />
        </>
      )}
    </div>
  );
}
