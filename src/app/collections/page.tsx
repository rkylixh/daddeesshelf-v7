import React from 'react';
import StarField from '@/components/layout/StarField';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CollectionsContent from './components/CollectionsContent';

export default function CollectionsPage() {
  return (
    <div className="page-container">
      <StarField />
      <Navbar />
      <main className="pt-16">
        <CollectionsContent />
      </main>
      <Footer />
    </div>
  );
}