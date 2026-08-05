import React from 'react';
import StarField from '@/components/layout/StarField';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import RequestContent from './components/RequestContent';

export const metadata = {
  title: "Request a Title — Daddee\'s Shelf",
  description: "Can\'t find the book you\'re looking for? Request a title and we\'ll try to include it in our next import batch.",
};

export default function RequestPage() {
  return (
    <div className="page-container">
      <StarField />
      <Navbar />
      <main className="pt-20">
        <RequestContent />
      </main>
      <Footer />
    </div>
  );
}
