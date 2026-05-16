"use client";

import { createContext, useContext, useEffect, useState } from "react";

type User = {
  id: string;
  email: string;
  role: string;
  name: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refresh: async () => {},
});

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUser() {
    setLoading(true);

    const res = await fetch("/api/me");

    if (!res.ok) {
      setUser(null);
      setLoading(false);
      return;
    }

    const data = await res.json();
    setUser(data);
    setLoading(false);
  }

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        refresh: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}