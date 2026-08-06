import React from 'react';
import StarField from '@/components/layout/StarField';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AvailableNowContent from './components/AvailableNowContent';

export default function AvailableNowPage() {
  return (
    <div className="page-container">
      <StarField />
      <Navbar />
      <main className="pt-20">
        <AvailableNowContent />
      </main>
      <Footer />
    </div>
  );
}
