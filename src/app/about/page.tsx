import React from 'react';
import StarField from '@/components/layout/StarField';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AboutContent from './components/AboutContent';

export const metadata = {
  title: "About — Daddee\'s Shelf",
  description: "Learn about Daddee\'s Shelf — your cozy corner for curated imported books in the Philippines.",
};

export default function AboutPage() {
  return (
    <div className="page-container">
      <StarField />
      <Navbar />
      <main className="pt-20">
        <AboutContent />
      </main>
      <Footer />
    </div>
  );
}
