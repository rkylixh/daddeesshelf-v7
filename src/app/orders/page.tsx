import React from 'react';
import StarField from '@/components/layout/StarField';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MyOrdersContent from './components/MyOrdersContent';

export const metadata = {
  title: "My Orders — Daddee\'s Shelf",
  description: "Look up your order status by TikTok handle.",
};

export default function MyOrdersPage() {
  return (
    <div className="page-container">
      <StarField />
      <Navbar />
      <main className="pt-20">
        <MyOrdersContent />
      </main>
      <Footer />
    </div>
  );
}
