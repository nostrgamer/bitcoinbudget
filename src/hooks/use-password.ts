import { useState, useEffect } from 'react';

// For Phase 2, we'll use a default password
// In Phase 3, this will be replaced with proper user authentication
const DEFAULT_PASSWORD = 'bitcoin-budget-default-password-2024';

export function usePassword() {
  const [password, setPassword] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // For now, automatically set the default password
    // In Phase 3, this will check for stored credentials or prompt for login
    setPassword(DEFAULT_PASSWORD);
    setIsLoading(false);
  }, []);

  return {
    password,
    isLoading,
    setPassword,
    hasPassword: !!password,
  };
} 