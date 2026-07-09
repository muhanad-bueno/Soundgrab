import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";

// ponytail: temporary Phase 1 smoke test — replaced entirely in Phase 3
function App() {
  const [result, setResult] = useState("");
  const [url, setUrl] = useState("");

  async function testFetch() {
    setResult("fetching...");
    try {
      const data = await invoke("fetch_metadata", { url });
      setResult(JSON.stringify(data, null, 2));
    } catch (e) {
      setResult("error: " + e);
    }
  }

  async function testFfmpeg() {
    setResult("setting up ffmpeg...");
    try {
      await invoke("setup_ffmpeg");
      setResult("ffmpeg ready");
    } catch (e) {
      setResult("error: " + e);
    }
  }

  return (
    <div style={{ padding: "2rem", background: "var(--paper)", minHeight: "100vh" }}>
      <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "var(--ink)", marginBottom: "1rem" }}>
        SOUNDGRAB — Phase 1 test
      </h1>
      <input
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="Paste a YouTube or SoundCloud URL"
        style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem", border: "1px solid var(--line)", borderRadius: 4 }}
      />
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button onClick={testFetch} style={{ padding: "0.5rem 1rem", background: "var(--grab-red)", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>
          fetch_metadata
        </button>
        <button onClick={testFfmpeg} style={{ padding: "0.5rem 1rem", background: "var(--signal-blue)", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>
          setup_ffmpeg
        </button>
      </div>
      <pre style={{ background: "#f0ede6", padding: "1rem", borderRadius: 4, fontSize: "0.8rem", overflowX: "auto", whiteSpace: "pre-wrap" }}>
        {result}
      </pre>
    </div>
  );
}

export default App;
