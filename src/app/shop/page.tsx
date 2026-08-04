import React from 'react';
import StarField from '@/components/layout/StarField';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ShopContent from './components/ShopContent';

export default function ShopPage() {
  return (
    <div className="page-container">
      <StarField />
      <Navbar />
      <main className="pt-16">
        <ShopContent />
      </main>
      <Footer />
    </div>
  );
}