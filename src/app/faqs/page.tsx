import React from 'react';
import StarField from '@/components/layout/StarField';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import FAQsContent from './components/FAQsContent';

export const metadata = {
  title: "FAQs — Daddee\'s Shelf",
  description: "Frequently asked questions about ordering, shipping, payment, and pre-orders at Daddee's Shelf.",
};

export default function FAQsPage() {
  return (
    <div className="page-container">
      <StarField />
      <Navbar />
      <main className="pt-20">
        <FAQsContent />
      </main>
      <Footer />
    </div>
  );
}
