import React from 'react';
import StarField from '@/components/layout/StarField';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WishlistContent from './components/WishlistContent';

export const metadata = {
  title: "Wishlist — Daddee\'s Shelf",
  description: "Save your favorite books and get notified when they're back in stock.",
};

export default function WishlistPage() {
  return (
    <div className="page-container">
      <StarField />
      <Navbar />
      <main className="pt-20">
        <WishlistContent />
      </main>
      <Footer />
    </div>
  );
}
