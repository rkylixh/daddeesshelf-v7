'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  CustomerSession,
  getCustomerSession,
  saveCustomerSession,
  clearCustomerSession,
} from '@/lib/customer-auth';

interface CustomerAuthContextValue {
  customer: CustomerSession | null;
  loading: boolean;
  login: (session: CustomerSession) => void;
  logout: () => void;
  isLoggedIn: boolean;
}

const CustomerAuthContext = createContext<CustomerAuthContextValue>({
  customer: null,
  loading: true,
  login: () => {},
  logout: () => {},
  isLoggedIn: false,
});

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getCustomerSession();
    setCustomer(session);
    setLoading(false);
  }, []);

  const login = useCallback((session: CustomerSession) => {
    saveCustomerSession(session);
    setCustomer(session);
  }, []);

  const logout = useCallback(() => {
    clearCustomerSession();
    setCustomer(null);
  }, []);

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        loading,
        login,
        logout,
        isLoggedIn: !!customer,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  return useContext(CustomerAuthContext);
}
