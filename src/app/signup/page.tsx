import React from 'react';
import type { Metadata } from 'next';
import SignupContent from './components/SignupContent';

export const metadata: Metadata = {
  title: "Sign Up | Daddee's Shelf",
  description: "Create your Daddee's Shelf account to track orders and title requests.",
};

export default function SignupPage() {
  return <SignupContent />;
}
