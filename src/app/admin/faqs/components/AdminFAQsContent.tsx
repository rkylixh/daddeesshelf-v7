'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import Icon from '@/components/ui/AppIcon';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/auditLog';

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
  status: string;
  is_published: boolean;
  created_at: string;
}

type AdminTab = 'faqs' | 'reader-questions';

function toast(msg: string, type: 'success' | 'error' = 'success') {
  // Simple inline toast using alert for now
  if (type === 'error') console.error(msg);
  else console.log(msg);
}

export default function AdminFAQsContent() {
  const [activeTab, setActiveTab] = useState<AdminTab>('faqs');

  // ── FAQs state ──
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<FAQ>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newFaq, setNewFaq] = useState({ category: '', question: '', answer: '', is_featured: false });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ── Reader Questions state ──
  const [questions, setQuestions] = useState<ReaderQuestion[]>([]);
  const [loadingQ, setLoadingQ] = useState(true);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [qFilter, setQFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => { loadFaqs(); }, []);
  useEffect(() => { loadQuestions(); }, []);

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };
  const showError = (msg: string) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(''), 4000); };

  const loadFaqs = async () => {
    setLoadingFaqs(true);
    const { data } = await supabase.from('faqs').select('*').order('category').order('sort_order').order('created_at');
    setFaqs((data ?? []) as FAQ[]);
    setLoadingFaqs(false);
  };

  const loadQuestions = async () => {
    setLoadingQ(true);
    const { data } = await supabase.from('reader_comments').select('*').order('created_at', { ascending: false });
    setQuestions((data ?? []) as ReaderQuestion[]);
    setLoadingQ(false);
  };

  // ── FAQ CRUD ──
  const handleSaveEdit = async (id: string) => {
    setSaving(true);
    const faq = faqs.find(f => f.id === id);
    const { error } = await supabase.from('faqs').update(editForm).eq('id', id);
    setSaving(false);
    if (error) { showError('Update failed: ' + error.message); return; }
    showSuccess('FAQ updated');
    setEditingId(null);
    await logAudit({
      action: 'FAQ_UPDATED',
      module: 'FAQs',
      target_ref: editForm.question ?? faq?.question ?? id,
      prev_value: faq?.question ?? '',
      new_value: editForm.question ?? '',
      explanation: `Admin updated FAQ "${editForm.question ?? faq?.question}" in category "${editForm.category ?? faq?.category}"`,
    });
    loadFaqs();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return;
    const faq = faqs.find(f => f.id === id);
    const { error } = await supabase.from('faqs').delete().eq('id', id);
    if (error) { showError('Delete failed'); return; }
    showSuccess('FAQ deleted');
    await logAudit({
      action: 'FAQ_DELETED',
      module: 'FAQs',
      target_ref: faq?.question ?? id,
      prev_value: faq?.question ?? '',
      new_value: 'DELETED',
      explanation: `Admin deleted FAQ "${faq?.question}" from category "${faq?.category}"`,
    });
    loadFaqs();
  };

  const handleToggleVisible = async (faq: FAQ) => {
    const newVal = !faq.is_visible;
    await supabase.from('faqs').update({ is_visible: newVal }).eq('id', faq.id);
    await logAudit({
      action: 'FAQ_VISIBILITY_TOGGLED',
      module: 'FAQs',
      target_ref: faq.question,
      prev_value: faq.is_visible ? 'visible' : 'hidden',
      new_value: newVal ? 'visible' : 'hidden',
      explanation: `Admin ${newVal ? 'published' : 'hid'} FAQ "${faq.question}"`,
    });
    loadFaqs();
  };

  const handleToggleFeatured = async (faq: FAQ) => {
    const newVal = !faq.is_featured;
    await supabase.from('faqs').update({ is_featured: newVal }).eq('id', faq.id);
    await logAudit({
      action: 'FAQ_FEATURED_TOGGLED',
      module: 'FAQs',
      target_ref: faq.question,
      prev_value: faq.is_featured ? 'featured' : 'not featured',
      new_value: newVal ? 'featured' : 'not featured',
      explanation: `Admin ${newVal ? 'featured' : 'unfeatured'} FAQ "${faq.question}"`,
    });
    loadFaqs();
  };

  const handleMoveSortOrder = async (faq: FAQ, direction: 'up' | 'down') => {
    const newOrder = direction === 'up' ? (faq.sort_order ?? 0) - 1 : (faq.sort_order ?? 0) + 1;
    await supabase.from('faqs').update({ sort_order: newOrder }).eq('id', faq.id);
    loadFaqs();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('faqs').insert({
      category: newFaq.category,
      question: newFaq.question,
      answer: newFaq.answer,
      is_featured: newFaq.is_featured,
      is_visible: true,
      sort_order: 0,
    });
    setSaving(false);
    if (error) { showError('Add failed: ' + error.message); return; }
    showSuccess('FAQ added');
    await logAudit({
      action: 'FAQ_ADDED',
      module: 'FAQs',
      target_ref: newFaq.question,
      prev_value: '',
      new_value: `Category: ${newFaq.category}`,
      explanation: `Admin added new FAQ "${newFaq.question}" to category "${newFaq.category}"`,
    });
    setShowAdd(false);
    setNewFaq({ category: '', question: '', answer: '', is_featured: false });
    loadFaqs();
  };

  // ── Reader Question actions ──
  const handleApprove = async (q: ReaderQuestion) => {
    await supabase.from('reader_comments').update({ is_published: true, status: 'Approved' }).eq('id', q.id);
    showSuccess('Question approved and published');
    await logAudit({
      action: 'READER_QUESTION_APPROVED',
      module: 'FAQs',
      target_ref: q.tiktok_handle,
      prev_value: 'Pending',
      new_value: 'Approved',
      explanation: `Admin approved and published reader question from @${q.tiktok_handle}: "${q.comment.slice(0, 80)}"`,
    });
    loadQuestions();
  };

  const handleReject = async (q: ReaderQuestion) => {
    await supabase.from('reader_comments').update({ is_published: false, status: 'Rejected' }).eq('id', q.id);
    showSuccess('Question rejected');
    await logAudit({
      action: 'READER_QUESTION_REJECTED',
      module: 'FAQs',
      target_ref: q.tiktok_handle,
      prev_value: q.is_published ? 'Approved' : 'Pending',
      new_value: 'Rejected',
      explanation: `Admin rejected reader question from @${q.tiktok_handle}: "${q.comment.slice(0, 80)}"`,
    });
    loadQuestions();
  };

  const handleSaveReply = async (id: string) => {
    setSaving(true);
    const q = questions.find(item => item.id === id);
    const { error } = await supabase.from('reader_comments').update({ admin_reply: replyText }).eq('id', id);
    setSaving(false);
    if (error) { showError('Reply failed'); return; }
    showSuccess('Reply saved');
    await logAudit({
      action: 'READER_QUESTION_REPLIED',
      module: 'FAQs',
      target_ref: q?.tiktok_handle ?? id,
      prev_value: q?.admin_reply ?? '',
      new_value: replyText,
      explanation: `Admin saved reply to reader question from @${q?.tiktok_handle ?? id}`,
    });
    setReplyingId(null);
    setReplyText('');
    loadQuestions();
  };

  const categories = [...new Set(faqs.map(f => f.category))];

  const filteredQuestions = questions.filter(q => {
    if (qFilter === 'pending') return !q.is_published && q.status !== 'Rejected';
    if (qFilter === 'approved') return q.is_published;
    if (qFilter === 'rejected') return q.status === 'Rejected';
    return true;
  });

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <AdminLayout title="FAQ Management">
      {/* Toast messages */}
      {successMsg && (
        <div className="fixed top-20 right-4 z-50 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg animate-fade-in"
          style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#10b981' }}>
          ✓ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="fixed top-20 right-4 z-50 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg animate-fade-in"
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171' }}>
          ✗ {errorMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('faqs')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'faqs' ? 'btn-primary' : 'btn-secondary'}`}
        >
          FAQs ({faqs.length})
        </button>
        <button
          onClick={() => setActiveTab('reader-questions')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'reader-questions' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Reader Questions ({questions.filter(q => !q.is_published && q.status !== 'Rejected').length} pending)
        </button>
      </div>

      {/* ── FAQs Tab ── */}
      {activeTab === 'faqs' && (
        <>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
              {faqs.length} FAQs across {categories.length} categories · {faqs.filter(f => f.is_featured).length} featured
            </p>
            <button onClick={() => setShowAdd(true)} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
              <Icon name="PlusIcon" size={15} /> Add FAQ
            </button>
          </div>

          {/* Add form */}
          {showAdd && (
            <div className="rounded-xl p-5 mb-6" style={{ background: 'var(--background-card)', border: '1px solid rgba(139,92,246,0.3)' }}>
              <h3 className="font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Add New FAQ</h3>
              <form onSubmit={handleAdd} className="space-y-3">
                <input
                  type="text" required placeholder="Category"
                  value={newFaq.category}
                  onChange={e => setNewFaq(f => ({ ...f, category: e.target.value }))}
                  className="input-field text-sm"
                  list="existing-categories"
                />
                <datalist id="existing-categories">
                  {categories.map(c => <option key={c} value={c} />)}
                </datalist>
                <input
                  type="text" required placeholder="Question"
                  value={newFaq.question}
                  onChange={e => setNewFaq(f => ({ ...f, question: e.target.value }))}
                  className="input-field text-sm"
                />
                <textarea
                  required rows={3} placeholder="Answer"
                  value={newFaq.answer}
                  onChange={e => setNewFaq(f => ({ ...f, answer: e.target.value }))}
                  className="input-field text-sm resize-none"
                />
                <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--foreground-muted)' }}>
                  <input
                    type="checkbox"
                    checked={newFaq.is_featured}
                    onChange={e => setNewFaq(f => ({ ...f, is_featured: e.target.checked }))}
                    className="rounded"
                  />
                  Feature this FAQ (appears in Most Popular Questions)
                </label>
                <div className="flex gap-2">
                  <button type="submit" disabled={saving} className="btn-primary text-sm px-4 py-2" style={{ opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'Saving...' : 'Save FAQ'}
                  </button>
                  <button type="button" onClick={() => setShowAdd(false)} className="btn-ghost text-sm px-4 py-2">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {loadingFaqs ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
            </div>
          ) : (
            <div className="space-y-6">
              {categories.map(cat => (
                <div key={cat}>
                  <h3 className="font-display text-sm font-bold mb-3 px-1" style={{ color: 'var(--primary-bright)' }}>{cat}</h3>
                  <div className="space-y-2">
                    {faqs.filter(f => f.category === cat).map(faq => (
                      <div
                        key={faq.id}
                        className="rounded-xl p-4"
                        style={{
                          background: 'var(--background-card)',
                          border: `1px solid ${faq.is_featured ? 'rgba(245,158,11,0.4)' : 'var(--border)'}`,
                          opacity: faq.is_visible ? 1 : 0.5,
                        }}
                      >
                        {editingId === faq.id ? (
                          <div className="space-y-2">
                            <input
                              value={editForm.category ?? ''}
                              onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                              className="input-field text-sm"
                              placeholder="Category"
                            />
                            <input
                              value={editForm.question ?? ''}
                              onChange={e => setEditForm(f => ({ ...f, question: e.target.value }))}
                              className="input-field text-sm"
                              placeholder="Question"
                            />
                            <textarea
                              rows={3}
                              value={editForm.answer ?? ''}
                              onChange={e => setEditForm(f => ({ ...f, answer: e.target.value }))}
                              className="input-field text-sm resize-none"
                              placeholder="Answer"
                            />
                            <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--foreground-muted)' }}>
                              <input
                                type="checkbox"
                                checked={editForm.is_featured ?? false}
                                onChange={e => setEditForm(f => ({ ...f, is_featured: e.target.checked }))}
                              />
                              Featured (Most Popular)
                            </label>
                            <div className="flex gap-2">
                              <button onClick={() => handleSaveEdit(faq.id)} disabled={saving} className="btn-primary text-xs px-3 py-1.5">
                                {saving ? 'Saving...' : 'Save'}
                              </button>
                              <button onClick={() => setEditingId(null)} className="btn-ghost text-xs px-3 py-1.5">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {faq.is_featured && (
                                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                                    ⭐ Featured
                                  </span>
                                )}
                                {!faq.is_visible && (
                                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(107,114,128,0.15)', color: '#6b7280', border: '1px solid rgba(107,114,128,0.3)' }}>
                                    Hidden
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground)' }}>{faq.question}</p>
                              <p className="text-xs leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>{faq.answer}</p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => handleMoveSortOrder(faq, 'up')}
                                className="btn-ghost p-1.5 rounded-lg"
                                title="Move up"
                              >
                                <Icon name="ChevronUpIcon" size={14} />
                              </button>
                              <button
                                onClick={() => handleMoveSortOrder(faq, 'down')}
                                className="btn-ghost p-1.5 rounded-lg"
                                title="Move down"
                              >
                                <Icon name="ChevronDownIcon" size={14} />
                              </button>
                              <button
                                onClick={() => handleToggleFeatured(faq)}
                                className="btn-ghost p-1.5 rounded-lg"
                                title={faq.is_featured ? 'Unfeature' : 'Feature'}
                                style={{ color: faq.is_featured ? '#f59e0b' : undefined }}
                              >
                                <Icon name="StarIcon" size={14} />
                              </button>
                              <button
                                onClick={() => handleToggleVisible(faq)}
                                className="btn-ghost p-1.5 rounded-lg"
                                title={faq.is_visible ? 'Hide' : 'Publish'}
                              >
                                <Icon name={faq.is_visible ? 'EyeIcon' : 'EyeSlashIcon'} size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(faq.id);
                                  setEditForm({ category: faq.category, question: faq.question, answer: faq.answer, is_featured: faq.is_featured });
                                }}
                                className="btn-ghost p-1.5 rounded-lg"
                              >
                                <Icon name="PencilIcon" size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(faq.id)}
                                className="btn-ghost p-1.5 rounded-lg"
                                style={{ color: '#f87171' }}
                              >
                                <Icon name="TrashIcon" size={14} style={{ color: '#f87171' } as React.CSSProperties} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Reader Questions Tab ── */}
      {activeTab === 'reader-questions' && (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setQFilter(f)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all capitalize ${qFilter === f ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {f} ({
                    f === 'all' ? questions.length :
                    f === 'pending' ? questions.filter(q => !q.is_published && q.status !== 'Rejected').length :
                    f === 'approved' ? questions.filter(q => q.is_published).length :
                    questions.filter(q => q.status === 'Rejected').length
                  })
                </button>
              ))}
            </div>
          </div>

          {loadingQ ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-16" style={{ color: 'var(--foreground-subtle)' }}>
              <p className="text-sm">No questions in this filter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map(q => (
                <div
                  key={q.id}
                  className="rounded-xl p-5"
                  style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-semibold" style={{ color: 'var(--primary-bright)' }}>{q.tiktok_handle}</span>
                        {q.customer_name && (
                          <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>· {q.customer_name}</span>
                        )}
                        <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>{formatDate(q.created_at)}</span>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>{q.comment}</p>
                    </div>
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{
                        background: q.is_published ? 'rgba(16,185,129,0.15)' : q.status === 'Rejected' ? 'rgba(107,114,128,0.15)' : 'rgba(245,158,11,0.15)',
                        color: q.is_published ? '#10b981' : q.status === 'Rejected' ? '#6b7280' : '#f59e0b',
                        border: `1px solid ${q.is_published ? 'rgba(16,185,129,0.3)' : q.status === 'Rejected' ? 'rgba(107,114,128,0.3)' : 'rgba(245,158,11,0.3)'}`,
                      }}
                    >
                      {q.is_published ? 'Approved' : q.status === 'Rejected' ? 'Rejected' : 'Pending Review'}
                    </span>
                  </div>

                  {/* Admin reply */}
                  {q.admin_reply && replyingId !== q.id && (
                    <div
                      className="rounded-lg p-3 mb-3"
                      style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}
                    >
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--primary-bright)' }}>✦ Official Reply:</p>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>{q.admin_reply}</p>
                    </div>
                  )}

                  {/* Reply form */}
                  {replyingId === q.id && (
                    <div className="mb-3 space-y-2">
                      <textarea
                        rows={3}
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        className="input-field text-sm resize-none"
                        placeholder="Write official reply..."
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveReply(q.id)}
                          disabled={saving}
                          className="btn-primary text-xs px-3 py-1.5"
                          style={{ opacity: saving ? 0.7 : 1 }}
                        >
                          {saving ? 'Saving...' : 'Save Reply'}
                        </button>
                        <button onClick={() => { setReplyingId(null); setReplyText(''); }} className="btn-ghost text-xs px-3 py-1.5">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    {!q.is_published && q.status !== 'Rejected' && (
                      <button onClick={() => handleApprove(q)} className="btn-primary text-xs px-3 py-1.5">
                        ✓ Approve & Publish
                      </button>
                    )}
                    {q.is_published && (
                      <button onClick={() => handleReject(q)} className="btn-ghost text-xs px-3 py-1.5" style={{ color: '#f87171' }}>
                        Unpublish
                      </button>
                    )}
                    {q.status !== 'Rejected' && !q.is_published && (
                      <button onClick={() => handleReject(q)} className="btn-ghost text-xs px-3 py-1.5" style={{ color: '#6b7280' }}>
                        Reject
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setReplyingId(q.id);
                        setReplyText(q.admin_reply ?? '');
                      }}
                      className="btn-ghost text-xs px-3 py-1.5"
                    >
                      <Icon name="ChatBubbleLeftIcon" size={12} className="inline mr-1" />
                      {q.admin_reply ? 'Edit Reply' : 'Reply'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
