import React from "react";
import type { User } from "@supabase/supabase-js";

type Props = {
  children?: React.ReactNode;
  user?: User | null;
  onSignOut?: () => Promise<void> | void;
};

export default function MainLayout({ children, user, onSignOut }: Props) {
  return (
    <div style={{ minHeight: "100vh", fontFamily: "system-ui, Arial, sans-serif" }}>
      <header style={{ padding: "12px 20px", borderBottom: "1px solid #eee", display: "flex", gap: 12 }}>
        <strong>WalkerGestión</strong>
        <div style={{ marginLeft: "auto" }}>
          {user?.email && <span style={{ marginRight: 8 }}>{user.email}</span>}
          {onSignOut && (
            <button onClick={() => onSignOut()} style={{ padding: "6px 10px" }}>
              Cerrar sesión
            </button>
          )}
        </div>
      </header>
      <main style={{ padding: 20 }}>{children}</main>
    </div>
  );
}