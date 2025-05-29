import { useState, useEffect } from 'react';

// For now, we'll use a simple password. In a real app, this would come from user authentication
const DEFAULT_PASSWORD = 'bitcoin-budget-password';

export function usePassword() {
  const [password, setPassword] = useState<string | null>(null);

  useEffect(() => {
    // For now, we'll use the default password
    // In Phase 3, this could be enhanced with proper user authentication
    setPassword(DEFAULT_PASSWORD);
  }, []);

  return {
    password,
    setPassword,
    isReady: !!password,
  };
} 