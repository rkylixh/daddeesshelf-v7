import React, { Suspense } from 'react';
import StarField from '@/components/layout/StarField';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BookDetailContent from './components/BookDetailContent';

export default function BookDetailPage() {
  return (
    <div className="page-container">
      <StarField />
      <Navbar />
      <main className="pt-20">
        <Suspense fallback={
          <div className="content-wrapper py-8 flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto mb-4" />
              <p style={{ color: 'var(--foreground-muted)' }}>Loading book details...</p>
            </div>
          </div>
        }>
          <BookDetailContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}