import React from 'react';
import StarField from '@/components/layout/StarField';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ContactContent from './components/ContactContent';

export const metadata = {
  title: "Contact — Daddee\'s Shelf",
  description: "Get in touch with Daddee's Shelf. We're here to help with orders, questions, and book requests.",
};

export default function ContactPage() {
  return (
    <div className="page-container">
      <StarField />
      <Navbar />
      <main className="pt-16">
        <ContactContent />
      </main>
      <Footer />
    </div>
  );
}
