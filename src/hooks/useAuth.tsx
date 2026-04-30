import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { disconnectSocket } from "@/lib/socket";
import { setAuthToken } from "@/lib/api";

type AuthContextValue = {
  user: { id: string; displayName: string } | null;
  token: string | null;
  loading: boolean;
  setAuth: (token: string, user: { id: string; displayName: string }) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredAuth(): { token: string; user: { id: string; displayName: string } } | null {
  const token = localStorage.getItem("zz_token");
  const userRaw = localStorage.getItem("zz_user");
  if (!token || !userRaw) return null;
  try {
    const user = JSON.parse(userRaw) as { id: string; displayName: string };
    if (!user?.id) return null;
    return { token, user };
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; displayName: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = readStoredAuth();
    if (stored) {
      setAuthToken(stored.token);
      setToken(stored.token);
      setUser(stored.user);
    }
    setLoading(false);
  }, []);

  const signOut = async () => {
    disconnectSocket();
    setAuthToken(null);
    localStorage.removeItem("zz_user");
    setToken(null);
    setUser(null);
  };

  const setAuth = (newToken: string, newUser: { id: string; displayName: string }) => {
    setAuthToken(newToken);
    localStorage.setItem("zz_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, setAuth, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
