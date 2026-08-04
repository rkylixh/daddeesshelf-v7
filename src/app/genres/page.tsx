import React from 'react';
import StarField from '@/components/layout/StarField';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import GenresContent from './components/GenresContent';

export const metadata = {
  title: "Genres — Daddee\'s Shelf",
  description: "Browse books by genre at Daddee\'s Shelf.",
};

export default function GenresPage() {
  return (
    <div className="page-container">
      <StarField />
      <Navbar />
      <main className="pt-16">
        <GenresContent />
      </main>
      <Footer />
    </div>
  );
}
