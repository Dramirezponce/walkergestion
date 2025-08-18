import React from "react";

export default function LoadingScreen({ message = "Cargando…" }: { message?: string }) {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        fontFamily: "system-ui, Arial, sans-serif",
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          border: "3px solid #ddd",
          borderTopColor: "#555",
          borderRadius: "50%",
          display: "inline-block",
          animation: "spin 1s linear infinite",
        }}
      />
      <span>{message}</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}