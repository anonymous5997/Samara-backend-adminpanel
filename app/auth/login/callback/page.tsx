"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

export default function AuthCallbackPage() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      window.location.href = "/profile";
    }
  }, [loading, user]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      Signing you in…
    </div>
  );
}
