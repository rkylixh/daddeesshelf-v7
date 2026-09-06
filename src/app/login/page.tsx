import React from 'react';
import type { Metadata } from 'next';
import LoginContent from './components/LoginContent';

export const metadata: Metadata = {
  title: "Login | Daddee's Shelf",
  description: "Log in to your Daddee's Shelf account.",
};

export default function LoginPage() {
  return <LoginContent />;
}
