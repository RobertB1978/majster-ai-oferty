import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, authSession) => {
      setSession(authSession);
      setUser(authSession?.user ?? null);
      setIsLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (import.meta.env.MODE === "development") {
        console.log("🔐 Login attempt:", {
          email,
          success: !error,
          error: error?.message || null,
          hasSession: !!data?.session,
          hasUser: !!data?.user,
        });
      }

      if (error) {
        if (import.meta.env.MODE === "development") {
          console.error("❌ Login error details:", error);
        }

        if (error.message.includes("Invalid login credentials")) {
          return { error: "Nieprawidłowy email lub hasło", data: undefined };
        }
        if (error.message.includes("Email not confirmed")) {
          return { error: "Email nie został potwierdzony. Sprawdź skrzynkę pocztową.", data: undefined };
        }
        if (error.message.includes("network") || error.message.includes("fetch")) {
          return { error: "Błąd połączenia. Sprawdź konfigurację Supabase w .env", data: undefined };
        }

        return { error: error.message, data: undefined };
      }

      return { error: null, data: { user: data.user, session: data.session } };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      if (import.meta.env.MODE === "development") {
        console.error("❌ Login exception:", err);
      }

      return {
        error: `Błąd logowania: ${errorMessage}. Sprawdź czy Supabase jest poprawnie skonfigurowany.`,
        data: undefined,
      };
    }
  };

  const register = async (email: string, password: string): Promise<{ error: string | null }> => {
    const redirectUrl = `${window.location.origin}/dashboard`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      if (error.message.includes("User already registered")) {
        return { error: "Konto z tym adresem email już istnieje" };
      }
      return { error: error.message };
    }

    return { error: null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return <AuthContext.Provider value={{ user, session, isLoading, login, register, logout }}>{children}</AuthContext.Provider>;
}
