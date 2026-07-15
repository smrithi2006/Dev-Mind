import { useState, useEffect, useRef } from "react";
import axios from "axios";
import jsPDF from "jspdf";

const PULSE_MESSAGES = [
  "Analyzing requirements...",
  "Consulting AWS service catalog...",
  "Designing architecture patterns...",
  "Calculating cost estimates...",
  "Generating Mermaid diagram...",
  "Compiling implementation steps...",
  "Evaluating alternatives...",
];

function TypewriterText({ text, speed = 18 }) {
  const [displayed, setDisplayed] = useState("");
  const idx = useRef(0);
  useEffect(() => {
    setDisplayed("");
    idx.current = 0;
    if (!text) return;
    const iv = setInterval(() => {
      idx.current += 1;
      setDisplayed(text.slice(0, idx.current));
      if (idx.current >= text.length) clearInterval(iv);
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);
  return <span>{displayed}</span>;
}

function MermaidDiagram({ chart }) {
  const wrapRef = useRef(null);
  const [err, setErr] = useState(null);
  const [mermaidReady, setMermaidReady] = useState(!!window.__mermaidLoaded);

  useEffect(() => {
    if (window.__mermaidLoaded) { setMermaidReady(true); return; }
    if (document.getElementById("mermaid-cdn")) return;
    const script = document.createElement("script");
    script.id = "mermaid-cdn";
    script.src = "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js";
    script.onload = () => {
      window.mermaid.initialize({
        startOnLoad: false, theme: "base",
        themeVariables: {
          primaryColor: "#00D4FF", primaryTextColor: "#E0F7FF",
          primaryBorderColor: "#00D4FF", lineColor: "#00D4FF",
          secondaryColor: "#0D2A3A", background: "transparent",
          nodeBorder: "#00D4FF", titleColor: "#00D4FF",
          fontFamily: "JetBrains Mono, monospace",
        },
        flowchart: { curve: "basis", htmlLabels: true },
      });
      window.__mermaidLoaded = true;
      setMermaidReady(true);
    };
    script.onerror = () => setErr("Could not load Mermaid library from CDN.");
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!mermaidReady || !chart || !wrapRef.current) return;
    setErr(null);
    wrapRef.current.innerHTML = "";
    const pre = document.createElement("pre");
    pre.className = "mermaid";
    pre.textContent = chart;
    wrapRef.current.appendChild(pre);
    window.mermaid.run({ nodes: [pre] }).catch((e) => {
      console.error("Mermaid error:", e);
      setErr("Diagram syntax error.");
    });
  }, [mermaidReady, chart]);

  return (
    <div>
      {err && <div className="mermaid-error"><span>⚠ {err}</span><pre style={{ marginTop: 8, fontSize: 11, opacity: 0.7 }}>{chart}</pre></div>}
      <div ref={wrapRef} className="mermaid-wrap" />
    </div>
  );
}

function ServiceCard({ service, purpose, estimated_monthly_cost, idx }) {
  return (
    <div className="service-card" style={{ animationDelay: `${idx * 80}ms` }}>
      <div className="service-left">
        <div className="service-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <div className="service-name">{service}</div>
          <div className="service-purpose">{purpose}</div>
        </div>
      </div>
      <div className="service-cost">
        <div className="cost-label">EST. / MONTH</div>
        <div className="cost-value">{estimated_monthly_cost}</div>
      </div>
    </div>
  );
}

// ── HISTORY SIDE PANEL ────────────────────────────────────────────────────
function HistoryPanel({ history, onSelect, onClear, isOpen, onClose }) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            zIndex: 199, backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, right: 0, height: "100vh", width: "320px",
        background: "var(--bg-2)", borderLeft: "1px solid var(--border)",
        zIndex: 200, display: "flex", flexDirection: "column",
        transform: isOpen ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: isOpen ? "-8px 0 32px rgba(0,0,0,0.4)" : "none",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 20px", borderBottom: "1px solid var(--border)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 8v4l3 3" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="12" r="9" stroke="var(--cyan)" strokeWidth="2"/>
            </svg>
            <span style={{ color: "var(--cyan)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, letterSpacing: 1, textTransform: "uppercase" }}>
              History
            </span>
            <span style={{
              background: "var(--cyan-dim)", color: "var(--cyan)", fontSize: 10,
              padding: "2px 8px", borderRadius: 99, border: "1px solid var(--border-bright)",
            }}>
              {history.length}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {history.length > 0 && (
              <button onClick={onClear} style={{
                background: "none", border: "1px solid var(--border)", color: "var(--text-3)",
                borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11,
                fontFamily: "var(--font-mono)",
              }}>
                Clear all
              </button>
            )}
            <button onClick={onClose} style={{
              background: "none", border: "none", color: "var(--text-2)",
              cursor: "pointer", padding: 4, borderRadius: 6,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px" }}>
          {history.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-3)" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }}>
                <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <p style={{ fontSize: 12 }}>No architectures yet.<br />Generate one to see it here.</p>
            </div>
          ) : (
            [...history].reverse().map((item, i) => (
              <div
                key={item.id}
                onClick={() => { onSelect(item); onClose(); }}
                style={{
                  padding: "14px", marginBottom: "8px",
                  border: "1px solid var(--border)", borderRadius: 10,
                  background: "var(--surface)", cursor: "pointer",
                  transition: "all 0.2s",
                  animation: `fade-up 0.3s ease both`,
                  animationDelay: `${i * 40}ms`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "var(--cyan)";
                  e.currentTarget.style.background = "var(--surface-hover)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.background = "var(--surface)";
                }}
              >
                {/* Architecture name */}
                <div style={{
                  color: "var(--cyan)", fontFamily: "var(--font-display)",
                  fontWeight: 700, fontSize: 13, marginBottom: 4,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {item.result.architecture_name}
                </div>
                {/* Requirement snippet */}
                <div style={{
                  color: "var(--text-2)", fontSize: 11, lineHeight: 1.5,
                  display: "-webkit-box", WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical", overflow: "hidden",
                  marginBottom: 8,
                }}>
                  {item.requirement}
                </div>
                {/* Footer row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-3)", fontSize: 10 }}>{item.time}</span>
                  <span style={{
                    color: "var(--green)", fontSize: 10, background: "rgba(0,255,148,0.08)",
                    padding: "2px 8px", borderRadius: 99, border: "1px solid rgba(0,255,148,0.2)",
                  }}>
                    {item.result.aws_services?.length} services
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
// ─────────────────────────────────────────────────────────────────────────

export default function App() {
  const [currentView, setCurrentView] = useState("landing");
  const [theme, setTheme] = useState("dark");
  const [requirement, setRequirement] = useState("");
  const [loading, setLoading] = useState(false);
  const [pulseMsg, setPulseMsg] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const pulseRef = useRef(null);
  const resultRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === "dark" ? "light" : "dark");

  const handleInput = (e) => {
    setRequirement(e.target.value);
    setCharCount(e.target.value.length);
  };

  const generate = async () => {
    if (!requirement.trim()) return;
    setLoading(true);
    setResult(null);
    setError("");
    setPulseMsg(0);
    pulseRef.current = setInterval(() => {
      setPulseMsg((p) => (p + 1) % PULSE_MESSAGES.length);
    }, 900);
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
// ...
const res = await axios.post(`${API_URL}/generate`, {
  requirement: requirement.trim(),
});
      setResult(res.data);

      // ── Save to history ──
      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      setHistory(prev => [...prev, {
        id: Date.now(),
        requirement: requirement.trim(),
        result: res.data,
        time: timeStr,
      }]);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (e) {
      setError(
        e?.response?.data?.detail || e?.message ||
        "Failed to reach the backend. Is it running on port 8000?"
      );
    } finally {
      clearInterval(pulseRef.current);
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) generate();
  };

  const loadFromHistory = (item) => {
    setResult(item.result);
    setRequirement(item.requirement);
    setCharCount(item.requirement.length);
    setCurrentView("app");
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  // ── PDF EXPORT ────────────────────────────────────────────────────────────
  const exportToPDF = () => {
    if (!result) return;
    setExporting(true);
    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = pdf.internal.pageSize.getWidth();
      const H = pdf.internal.pageSize.getHeight();
      const margin = 18;
      const contentW = W - margin * 2;
      let y = 0;

      const newPage = () => { pdf.addPage(); y = margin; drawHeader(); };
      const checkY = (needed = 10) => { if (y + needed > H - 16) newPage(); };

      const drawHeader = () => {
        pdf.setFillColor(13, 27, 42);
        pdf.rect(0, 0, W, 14, "F");
        pdf.setTextColor(0, 212, 255);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.text("DevMind  —  Solution Architect Report", W / 2, 9, { align: "center" });
      };

      const sectionTitle = (text) => {
        checkY(14);
        pdf.setFillColor(0, 212, 255);
        pdf.rect(margin, y, 3, 7, "F");
        pdf.setTextColor(13, 27, 42);
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.text(text, margin + 6, y + 5.5);
        y += 12;
      };

      const divider = () => {
        checkY(6);
        pdf.setDrawColor(220, 220, 220);
        pdf.line(margin, y, W - margin, y);
        y += 5;
      };

      drawHeader();
      y = 22;

      // Title block
      pdf.setFillColor(245, 248, 252);
      pdf.roundedRect(margin, y, contentW, 38, 3, 3, "F");
      pdf.setTextColor(0, 130, 180);
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      const titleLines = pdf.splitTextToSize(result.architecture_name, contentW - 10);
      pdf.text(titleLines, W / 2, y + 12, { align: "center" });
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Generated: ${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}   |   DevMind · HACK'A'WAR 2025`, W / 2, y + 22, { align: "center" });
      const overviewLines = pdf.splitTextToSize(result.overview || "", contentW - 10);
      pdf.setFontSize(9);
      pdf.setTextColor(80, 80, 80);
      pdf.text(overviewLines, W / 2, y + 30, { align: "center" });
      y += 46;

      sectionTitle("AWS SERVICES");
      result.aws_services?.forEach((s, i) => {
        checkY(20);
        pdf.setFillColor(i % 2 === 0 ? 250 : 245, 250, 252);
        pdf.roundedRect(margin, y, contentW, 16, 2, 2, "F");
        pdf.setDrawColor(220, 235, 245);
        pdf.roundedRect(margin, y, contentW, 16, 2, 2, "S");
        pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); pdf.setTextColor(13, 27, 42);
        pdf.text(s.service, margin + 4, y + 6);
        pdf.setFont("helvetica", "normal"); pdf.setFontSize(8); pdf.setTextColor(90, 90, 90);
        const pLines = pdf.splitTextToSize(s.purpose, contentW - 50);
        pdf.text(pLines[0], margin + 4, y + 12);
        pdf.setFillColor(0, 160, 100);
        pdf.roundedRect(W - margin - 28, y + 3, 26, 9, 2, 2, "F");
        pdf.setTextColor(255, 255, 255); pdf.setFont("helvetica", "bold"); pdf.setFontSize(8);
        pdf.text(s.estimated_monthly_cost, W - margin - 15, y + 9, { align: "center" });
        y += 19;
      });

      y += 4; divider();

      sectionTitle("IMPLEMENTATION STEPS");
      result.implementation_steps?.forEach((step, i) => {
        checkY(14);
        pdf.setFillColor(0, 130, 180);
        pdf.circle(margin + 4, y + 3, 3.5, "F");
        pdf.setTextColor(255, 255, 255); pdf.setFont("helvetica", "bold"); pdf.setFontSize(7);
        pdf.text(String(i + 1), margin + 4, y + 4.5, { align: "center" });
        pdf.setFont("helvetica", "normal"); pdf.setFontSize(9); pdf.setTextColor(40, 40, 40);
        const stepLines = pdf.splitTextToSize(step, contentW - 12);
        checkY(stepLines.length * 5 + 4);
        pdf.text(stepLines, margin + 11, y + 4);
        y += stepLines.length * 5 + 5;
      });

      y += 4; divider();

      sectionTitle("ALTERNATIVE ARCHITECTURES");
      result.alternative_architectures?.forEach((alt, i) => {
        checkY(16);
        const label = `ALT ${String.fromCharCode(65 + i)}`;
        pdf.setFillColor(120, 80, 200);
        pdf.roundedRect(margin, y, 14, 7, 1.5, 1.5, "F");
        pdf.setTextColor(255, 255, 255); pdf.setFont("helvetica", "bold"); pdf.setFontSize(6.5);
        pdf.text(label, margin + 7, y + 4.8, { align: "center" });
        pdf.setFont("helvetica", "normal"); pdf.setFontSize(9); pdf.setTextColor(40, 40, 40);
        const altLines = pdf.splitTextToSize(alt, contentW - 18);
        checkY(altLines.length * 5 + 4);
        pdf.text(altLines, margin + 17, y + 5);
        y += altLines.length * 5 + 8;
      });

      const totalPages = pdf.internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        pdf.setPage(p);
        pdf.setFillColor(245, 245, 245);
        pdf.rect(0, H - 10, W, 10, "F");
        pdf.setTextColor(150, 150, 150); pdf.setFontSize(7); pdf.setFont("helvetica", "normal");
        pdf.text(`Generated by DevMind  ·  HACK'A'WAR 2025  ·  Solution Architect Agent  ·  Page ${p} of ${totalPages}`, W / 2, H - 4, { align: "center" });
      }

      pdf.save(`DevMind_${result.architecture_name.replace(/\s+/g, "_")}_${Date.now()}.pdf`);
    } catch (err) {
      console.error("Export error:", err);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="app">
      <div className="bg-grid" />
      <div className="bg-glow" />

      {/* History Side Panel */}
      <HistoryPanel
        history={history}
        onSelect={loadFromHistory}
        onClear={() => setHistory([])}
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />

      <header className="header">
        <div className="logo" onClick={() => setCurrentView("landing")}>
          <div className="logo-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" stroke="var(--cyan)" strokeWidth="1.5" fill="none" />
              <polygon points="14,7 21,11 21,18 14,22 7,18 7,11" fill="var(--cyan)" opacity="0.15" stroke="var(--cyan)" strokeWidth="1" />
              <circle cx="14" cy="14" r="3" fill="var(--cyan)" />
            </svg>
          </div>
          <div className="logo-text">
            <span className="logo-dev">Dev</span>
            <span className="logo-mind">Mind</span>
          </div>
        </div>
        <div className="header-tag">Solution Architect Agent</div>
        <div className="header-actions">
          <div className="header-status">
            <span className={`status-dot ${loading ? "pulse" : "idle"}`} />
            <span className="status-label">{loading ? "Processing" : "Ready"}</span>
          </div>

          {/* History button */}
          <button className="icon-btn" onClick={() => setHistoryOpen(true)} title="History" style={{ position: "relative" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
            </svg>
            {history.length > 0 && (
              <span style={{
                position: "absolute", top: 2, right: 2,
                width: 8, height: 8, borderRadius: "50%",
                background: "var(--cyan)", border: "2px solid var(--bg-2)",
              }} />
            )}
          </button>

          <button className="icon-btn" onClick={() => setCurrentView("about")} title="About">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === "dark" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
      </header>

      <main className="main">

        {currentView === "landing" && (
          <div className="view-container">
            <div className="hero-eyebrow">AWS Architecture Generator</div>
            <h1 className="hero-title">
              Describe your system.<br />
              <span className="hero-accent">We architect it.</span>
            </h1>
            <p className="hero-sub">
              Paste your project requirement in plain English. DevMind's Architect Agent will
              generate a complete AWS architecture with cost estimates, a live diagram,
              and step-by-step implementation guide.
            </p>
            <button className="get-started-btn" onClick={() => setCurrentView("app")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Try the Architect
            </button>
          </div>
        )}

        {currentView === "about" && (
          <div className="view-container">
            <div className="hero-eyebrow">About DevMind</div>
            <h1 className="hero-title">Built for <span className="hero-accent">builders.</span></h1>
            <div className="about-content">
              <h3>What is DevMind?</h3>
              <p>DevMind is an AI-powered Solution Architect Agent that takes your plain English system requirements and generates a complete, production-ready AWS architecture instantly.</p>
              <h3>What does it generate?</h3>
              <p>For every requirement, DevMind produces: recommended AWS services with cost estimates, a live architecture diagram, step-by-step implementation guide, and alternative architecture options.</p>
              <h3>Built at HACK'A'WAR 2025</h3>
              <p>DevMind was built as part of HACK'A'WAR 2025 by Amrutha, combining FastAPI, React, and NVIDIA's Llama 3.1 405B model.</p>
            </div>
            <button className="get-started-btn" onClick={() => setCurrentView("app")} style={{marginTop: 24}}>
              Try the Architect
            </button>
          </div>
        )}

        {currentView === "app" && (
          <>
            <section className="hero" style={{paddingTop: "40px", paddingBottom: "32px"}}>
              <div className="hero-eyebrow">AWS Architecture Generator</div>
              <h1 className="hero-title" style={{fontSize: "clamp(28px, 4vw, 46px)"}}>
                Describe your system.<br />
                <span className="hero-accent">We architect it.</span>
              </h1>
            </section>

            <section className="input-section">
              <div className="input-card">
                <div className="input-header">
                  <span className="input-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
                      <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Your Requirement
                  </span>
                  <span className="char-count">{charCount} chars</span>
                </div>
                <textarea
                  className="req-textarea"
                  placeholder={`e.g. "Build a scalable real-time chat application supporting 100k concurrent users..."`}
                  value={requirement}
                  onChange={handleInput}
                  onKeyDown={handleKey}
                  rows={5}
                  disabled={loading}
                />
                <div className="input-footer">
                  <span className="hint-text">⌘ + Enter to generate</span>
                  <button
                    className={`generate-btn ${loading ? "loading" : ""}`}
                    onClick={generate}
                    disabled={loading || !requirement.trim()}
                  >
                    {loading ? (
                      <><span className="btn-spinner" />Architecting...</>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Generate Architecture
                      </>
                    )}
                  </button>
                </div>
              </div>
            </section>

            {loading && (
              <section className="loading-section">
                <div className="loading-card">
                  <div className="loading-rings">
                    <div className="ring r1" /><div className="ring r2" /><div className="ring r3" />
                    <div className="ring-center">
                      <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                        <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" stroke="var(--cyan)" strokeWidth="1.5" fill="none" />
                        <circle cx="14" cy="14" r="3" fill="var(--cyan)" />
                      </svg>
                    </div>
                  </div>
                  <div className="loading-msg">{PULSE_MESSAGES[pulseMsg]}</div>
                  <div className="loading-dots"><span /><span /><span /></div>
                </div>
              </section>
            )}

            {error && (
              <div className="error-bar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {error}
              </div>
            )}

            {result && (
              <div className="results" ref={resultRef}>
                <div className="result-hero">
                  <div className="result-eyebrow">Architecture Generated</div>
                  <h2 className="arch-name">
                    <TypewriterText text={result.architecture_name} speed={30} />
                  </h2>
                  <p className="arch-overview">{result.overview}</p>
                  <button className="export-btn" onClick={exportToPDF} disabled={exporting}>
                    {exporting ? (
                      <><span className="btn-spinner" style={{borderTopColor:"var(--green)"}} />Exporting...</>
                    ) : (
                      <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ marginRight: 7 }}>
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Export as PDF
                      </>
                    )}
                  </button>
                </div>

                <div className="results-grid">
                  <section className="panel services-panel">
                    <div className="panel-header">
                      <div className="panel-icon aws">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M6.5 20a4.5 4.5 0 01-.43-8.98A7 7 0 1117.5 20H6.5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span>AWS Services</span>
                      <span className="panel-count">{result.aws_services?.length}</span>
                    </div>
                    <div className="services-list">
                      {result.aws_services?.map((s, i) => <ServiceCard key={i} {...s} idx={i} />)}
                    </div>
                  </section>

                  <section className="panel diagram-panel">
                    <div className="panel-header">
                      <div className="panel-icon diag">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
                          <rect x="15" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
                          <rect x="9" y="15" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
                          <path d="M6 9v3a3 3 0 003 3h6a3 3 0 003-3V9" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      </div>
                      <span>Architecture Diagram</span>
                    </div>
                    <div className="diagram-container">
                      {result.mermaid_diagram ? <MermaidDiagram chart={result.mermaid_diagram} /> : <p className="no-diagram">No diagram provided.</p>}
                    </div>
                  </section>

                  <section className="panel steps-panel">
                    <div className="panel-header">
                      <div className="panel-icon steps">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span>Implementation Steps</span>
                    </div>
                    <ol className="steps-list">
                      {result.implementation_steps?.map((step, i) => (
                        <li key={i} className="step-item" style={{ animationDelay: `${i * 60}ms` }}>
                          <span className="step-num">{String(i + 1).padStart(2, "0")}</span>
                          <span className="step-text">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </section>

                  <section className="panel alt-panel">
                    <div className="panel-header">
                      <div className="panel-icon alt">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <polyline points="17 1 21 5 17 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M3 11V9a4 4 0 014-4h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <polyline points="7 23 3 19 7 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M21 13v2a4 4 0 01-4 4H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span>Alternative Architectures</span>
                    </div>
                    <div className="alt-list">
                      {result.alternative_architectures?.map((alt, i) => (
                        <div key={i} className="alt-item" style={{ animationDelay: `${i * 80}ms` }}>
                          <span className="alt-num">ALT {String.fromCharCode(65 + i)}</span>
                          <span className="alt-text">{alt}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="footer">
        <span>DevMind</span>
        <span className="footer-sep">·</span>
        <span>HACK'A'WAR 2025</span>
        <span className="footer-sep">·</span>
        <span>Solution Architect Agent</span>
      </footer>
    </div>
  );
}