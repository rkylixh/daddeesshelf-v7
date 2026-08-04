import React from 'react';

export default function AboutContent() {
  return (
    <div className="content-wrapper py-12">
      {/* Header */}
      <div className="text-center mb-16">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)', letterSpacing: '0.2em' }}>
          ✦ Our Story ✦
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
          About Daddee&apos;s Shelf
        </h1>
        <p className="text-sm max-w-lg mx-auto" style={{ color: 'var(--foreground-muted)', lineHeight: '1.7' }}>
          Your cozy corner for curated imported books — bringing the world&apos;s best stories to Filipino readers.
        </p>
      </div>
      {/* Mission */}
      <div className="max-w-3xl mx-auto mb-16">
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(79,70,229,0.08))', border: '1px solid rgba(139,92,246,0.25)' }}
        >
          <span className="text-4xl mb-6 block" aria-hidden="true">✦</span>
          <h2 className="font-display text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
            Our Mission
          </h2>
          <p className="text-base leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
            Daddee&apos;s Shelf was born from a simple belief: great stories should be accessible to everyone.
            We curate and import the titles that matter — BookTok sensations, beloved classics, gripping thrillers,
            and heartwarming romance — and bring them directly to Filipino readers at honest prices.
          </p>
        </div>
      </div>
      {/* Values grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto">
        {[
          { icon: '📚', title: 'Authenticity', desc: 'Every book is a 100% original edition sourced directly from reputable international publishers. Zero tolerance for counterfeit reprints.' },
          { icon: '✦', title: 'Curation', desc: 'We handpick every title with care — from BookTok favorites to hidden gems — so your shelf is always filled with books worth reading.' },
          { icon: '🌟', title: 'Community', desc: 'Built on TikTok Live, grown through genuine connections. We are more than a bookstore — we are a community of readers.' },
        ]?.map(v => (
          <div
            key={v?.title}
            className="rounded-xl p-6 text-center"
            style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
          >
            <span className="text-3xl mb-4 block" aria-hidden="true">{v?.icon}</span>
            <h3 className="font-display text-lg font-bold mb-2" style={{ color: 'var(--foreground)' }}>{v?.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>{v?.desc}</p>
          </div>
        ))}
      </div>
      {/* How it works */}
      <div className="max-w-3xl mx-auto mb-16">
        <h2 className="font-display text-2xl font-bold text-center mb-8" style={{ color: 'var(--foreground)' }}>
          How Daddee&apos;s Shelf Works
        </h2>
        <div className="space-y-4">
          {[
            { step: '01', title: 'We Source Directly', desc: 'Books are imported in bulk batches directly from international publishers and trusted global distributors — bypassing middlemen to keep prices honest.' },
            { step: '02', title: 'You Pre-Order', desc: 'Browse upcoming batches, reserve your copy with full payment, and wait for your notification when the shipment arrives in Manila.' },
            { step: '03', title: 'We Pack with Care', desc: 'Every order is inspected, wrapped in premium bubble wrap, and packed securely before shipping via your preferred courier.' },
            { step: '04', title: 'Your Books Arrive', desc: 'Choose immediate shipping or consolidate multiple orders for savings. Your books arrive at your door, ready to be loved.' },
          ]?.map(s => (
            <div
              key={s?.step}
              className="flex gap-5 p-5 rounded-xl"
              style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
            >
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm"
                style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--primary-bright)', border: '1px solid rgba(139,92,246,0.3)' }}
              >
                {s?.step}
              </div>
              <div>
                <h4 className="font-semibold mb-1" style={{ color: 'var(--foreground)' }}>{s?.title}</h4>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>{s?.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* TikTok CTA */}
      <div
        className="rounded-2xl p-8 text-center max-w-2xl mx-auto"
        style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}
      >
        <h2 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
          Follow Us on TikTok
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--foreground-muted)' }}>
          Join our community at <strong style={{ color: 'var(--primary-bright)' }}>@daddees.shelf</strong> for live book drops,
          unboxings, and exclusive pre-order announcements.
        </p>
        <a
          href="https://tiktok.com/@daddees.shelf"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary text-sm px-8 py-3 inline-block"
        >
          Follow @daddees.shelf ✦
        </a>
      </div>
    </div>
  );
}
