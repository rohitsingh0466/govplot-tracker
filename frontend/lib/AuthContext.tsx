/**
 * GovPlot Tracker v1.1 — Auth Context
 * Wraps localStorage-based token auth into a React context
 * so any page can call useAuth() instead of repeating localStorage logic.
 */
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/router";

type AuthUser = {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
  is_premium: boolean;
  subscription_tier: string;
  subscription_status: string;
  telegram_username?: string | null;
  phone?: string | null;
  capabilities?: string[];
};

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isPro: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isPro: false,
  setUser: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  function loadFromStorage() {
    const raw = typeof window !== "undefined"
      ? window.localStorage.getItem("govplot_auth_user")
      : null;
    const tok = typeof window !== "undefined"
      ? window.localStorage.getItem("govplot_auth_token")
      : null;
    setUserState(raw ? JSON.parse(raw) : null);
    setToken(tok);
  }

  useEffect(() => {
    loadFromStorage();
    window.addEventListener("govplot-auth-changed", loadFromStorage);
    return () => window.removeEventListener("govplot-auth-changed", loadFromStorage);
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    const tokenFromQuery = typeof router.query.token === "string" ? router.query.token : null;
    const userFromQuery = typeof router.query.user === "string" ? router.query.user : null;
    if (!tokenFromQuery || !userFromQuery) return;

    try {
      const parsedUser = JSON.parse(userFromQuery) as AuthUser;
      localStorage.setItem("govplot_auth_token", tokenFromQuery);
      localStorage.setItem("govplot_auth_user", JSON.stringify(parsedUser));
      setToken(tokenFromQuery);
      setUserState(parsedUser);
      window.dispatchEvent(new Event("govplot-auth-changed"));

      const nextQuery = { ...router.query };
      delete nextQuery.token;
      delete nextQuery.user;
      router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true });
    } catch {
      localStorage.removeItem("govplot_auth_token");
      localStorage.removeItem("govplot_auth_user");
    }
  }, [router.isReady, router.pathname, router.query]);

  function setUser(next: AuthUser | null) {
    if (next) {
      localStorage.setItem("govplot_auth_user", JSON.stringify(next));
    } else {
      localStorage.removeItem("govplot_auth_user");
    }
    setUserState(next);
    setToken(localStorage.getItem("govplot_auth_token"));
    window.dispatchEvent(new Event("govplot-auth-changed"));
  }

  function logout() {
    localStorage.removeItem("govplot_auth_token");
    localStorage.removeItem("govplot_auth_user");
    setUserState(null);
    setToken(null);
    window.dispatchEvent(new Event("govplot-auth-changed"));
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isPro: ["pro", "premium"].includes(user?.subscription_tier ?? ""),
      setUser,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
