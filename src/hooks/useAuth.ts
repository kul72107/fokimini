import { useCallback, useMemo, useState, useEffect } from "react";
import { localAuth, type LocalUser } from "@/lib/localAuth";

export function useAuth() {
  const [user, setUser] = useState<LocalUser | null>(() => localAuth.me());

  // Re-check localStorage on mount (in case another tab changed it)
  useEffect(() => {
    const check = () => setUser(localAuth.me());
    check();
    window.addEventListener("storage", check);
    return () => window.removeEventListener("storage", check);
  }, []);

  const login = useCallback((username: string, password: string) => {
    const result = localAuth.login(username, password);
    if (result.ok) {
      setUser(result.user);
      window.dispatchEvent(new Event("storage"));
    }
    return result;
  }, []);

  const register = useCallback((username: string, password: string, displayName: string) => {
    const result = localAuth.register(username, password, displayName);
    if (result.ok) {
      setUser(result.user);
      window.dispatchEvent(new Event("storage"));
    }
    return result;
  }, []);

  const logout = useCallback(() => {
    localAuth.logout();
    setUser(null);
    // Also clear Kimi auth cookie if present
    document.cookie = "local_auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.reload();
  }, []);

  return useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading: false,
      error: null,
      login,
      register,
      logout,
      refresh: () => setUser(localAuth.me()),
    }),
    [user, login, register, logout]
  );
}
