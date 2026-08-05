import React, { Suspense } from 'react';
import StarField from '@/components/layout/StarField';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ShopContent from './components/ShopContent';

export default function ShopPage() {
  return (
    <div className="page-container">
      <StarField />
      <Navbar />
      <main className="pt-20">
        <Suspense fallback={
          <div className="content-wrapper py-8 flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
          </div>
        }>
          <ShopContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}