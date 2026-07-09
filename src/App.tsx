function App() {
  return (
    <div style={{ padding: "2rem", background: "var(--paper)", minHeight: "100vh" }}>
      <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "2rem", color: "var(--ink)" }}>
        SOUNDGRAB
      </h1>
      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
        <div style={{ width: 40, height: 40, background: "var(--grab-red)", borderRadius: 4 }} title="grab-red" />
        <div style={{ width: 40, height: 40, background: "var(--signal-blue)", borderRadius: 4 }} title="signal-blue" />
        <div style={{ width: 40, height: 40, background: "var(--success)", borderRadius: 4 }} title="success" />
        <div style={{ width: 40, height: 40, background: "var(--line)", borderRadius: 4 }} title="line" />
      </div>
      <p style={{ marginTop: "1rem", color: "var(--ink)", fontFamily: "Inter, sans-serif" }}>
        Phase 0 token check — red · blue · green · line
      </p>
    </div>
  );
}

export default App;
