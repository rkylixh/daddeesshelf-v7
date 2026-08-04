import React from 'react';
import StarField from '@/components/layout/StarField';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PreorderContent from './components/PreorderContent';

export default function PreorderListPage() {
  return (
    <div className="page-container">
      <StarField />
      <Navbar />
      <main className="pt-16">
        <PreorderContent />
      </main>
      <Footer />
    </div>
  );
}