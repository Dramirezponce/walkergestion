import React, { useState } from "react";
import { isConfigured } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const { signInWithOtp } = useAuth();

  if (!isConfigured) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Configura Supabase</h2>
        <p>Faltan VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY en .env.local.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Ingresar</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const { error } = await signInWithOtp(email);
          alert(error ? `Error: ${error.message}` : "Revisa tu correo para el enlace de acceso.");
        }}
      >
        <input
          type="email"
          placeholder="tu@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: 8, marginRight: 8 }}
        />
        <button type="submit" style={{ padding: "8px 12px" }}>
          Enviar enlace
        </button>
      </form>
    </div>
  );
}