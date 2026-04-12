import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [failCount, setFailCount] = useState(0);
  const [showPass, setShowPass]   = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const t = localStorage.getItem("govplot_admin_token");
      if (t) router.replace("/admin_backend/dashboard");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API}/api/v1/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFailCount(c => c + 1);
        setError(
          res.status === 429
            ? data.detail
            : `Invalid credentials${failCount >= 2 ? ` — ${5 - failCount - 1} attempts remaining before 15-min lockout` : ""}`
        );
        return;
      }
      localStorage.setItem("govplot_admin_token", data.access_token);
      localStorage.setItem("govplot_admin_email", data.admin_email);
      router.push("/admin_backend/dashboard");
    } catch {
      setError("Connection error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Admin Login — GovPlot Tracker</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
      `}</style>

      <div className="root">
        {/* Animated dark mesh background */}
        <div className="bg-layer">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
          <div className="grid-overlay" />
        </div>

        <div className="card">
          {/* Header */}
          <div className="card-top">
            <div className="logo-wrap">
              <div className="logo-box">🏠</div>
              <div className="logo-text">
                <span className="logo-brand">GovPlot</span>
                <span className="logo-sub">Admin Portal</span>
              </div>
            </div>
          </div>

          <div className="card-body">
            <h1 className="heading">Welcome back</h1>
            <p className="subheading">Sign in to manage your platform</p>

            {error && (
              <div className="error-box">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="form">
              <div className="field">
                <label>Email address</label>
                <div className="input-wrap">
                  <svg className="ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="admin@govplottracker.com" required autoComplete="username"
                    disabled={loading} />
                </div>
              </div>

              <div className="field">
                <label>Password</label>
                <div className="input-wrap">
                  <svg className="ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input type={showPass ? "text" : "password"} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••" required autoComplete="current-password"
                    disabled={loading} />
                  <button type="button" className="eye-btn" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                    {showPass ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (
                  <span className="loading-row">
                    <span className="spinner" /> Authenticating…
                  </span>
                ) : "Sign in →"}
              </button>
            </form>
          </div>

          <div className="card-footer">
            Protected · GovPlot Tracker Admin v1.0
          </div>
        </div>
      </div>

      <style jsx>{`
        .root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: #040a12;
          position: relative;
          font-family: 'DM Sans', system-ui, sans-serif;
        }

        /* Background */
        .bg-layer { position: fixed; inset: 0; overflow: hidden; pointer-events: none; }
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          animation: drift 12s ease-in-out infinite alternate;
        }
        .orb-1 {
          width: 600px; height: 600px; top: -200px; left: -150px;
          background: radial-gradient(circle, rgba(13,122,104,0.18) 0%, transparent 70%);
          animation-duration: 14s;
        }
        .orb-2 {
          width: 400px; height: 400px; bottom: -100px; right: -100px;
          background: radial-gradient(circle, rgba(232,116,34,0.10) 0%, transparent 70%);
          animation-duration: 11s; animation-delay: -5s;
        }
        .orb-3 {
          width: 300px; height: 300px; top: 40%; left: 55%;
          background: radial-gradient(circle, rgba(13,122,104,0.10) 0%, transparent 70%);
          animation-duration: 16s; animation-delay: -3s;
        }
        .grid-overlay {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        @keyframes drift { from { transform: translate(0,0) scale(1); } to { transform: translate(30px,20px) scale(1.05); } }

        /* Card */
        .card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 420px;
          background: rgba(8,16,26,0.92);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          overflow: hidden;
          box-shadow:
            0 0 0 1px rgba(13,122,104,0.10),
            0 40px 80px rgba(0,0,0,0.7),
            0 0 60px rgba(13,122,104,0.06);
          backdrop-filter: blur(20px);
        }

        .card-top {
          padding: 28px 28px 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding-bottom: 20px;
        }

        .logo-wrap { display: flex; align-items: center; gap: 10px; }
        .logo-box {
          width: 42px; height: 42px;
          background: linear-gradient(135deg, #0d7a68, #12c2a4);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          box-shadow: 0 4px 20px rgba(13,122,104,0.4);
        }
        .logo-text { display: flex; flex-direction: column; }
        .logo-brand {
          font-family: 'Outfit', system-ui, sans-serif;
          font-weight: 800; font-size: 16px; color: #fff; letter-spacing: -0.3px;
        }
        .logo-sub {
          font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 2.5px; color: #0f9e87;
        }

        .card-body { padding: 28px; }

        .heading {
          font-family: 'Outfit', system-ui, sans-serif;
          font-size: 26px; font-weight: 900; color: #fff;
          letter-spacing: -0.5px; margin-bottom: 6px;
        }
        .subheading { font-size: 13.5px; color: rgba(255,255,255,0.38); margin-bottom: 24px; }

        /* Error */
        .error-box {
          display: flex; align-items: flex-start; gap: 8px;
          background: rgba(220,38,38,0.10);
          border: 1px solid rgba(220,38,38,0.25);
          border-radius: 10px;
          padding: 11px 13px;
          font-size: 13px; color: #fca5a5;
          margin-bottom: 20px;
          animation: shake 0.3s ease;
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }

        /* Form */
        .form { display: flex; flex-direction: column; gap: 18px; }

        .field { display: flex; flex-direction: column; gap: 7px; }
        .field label {
          font-size: 11.5px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 1px;
          color: rgba(255,255,255,0.38);
        }

        .input-wrap { position: relative; display: flex; align-items: center; }
        .ico {
          position: absolute; left: 13px;
          color: rgba(255,255,255,0.2); pointer-events: none;
        }
        .input-wrap input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(255,255,255,0.09);
          border-radius: 11px;
          padding: 12px 14px 12px 40px;
          font-size: 14px; font-family: inherit;
          color: #fff; outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .input-wrap input::placeholder { color: rgba(255,255,255,0.18); }
        .input-wrap input:focus {
          border-color: rgba(13,122,104,0.65);
          background: rgba(13,122,104,0.06);
        }
        .input-wrap input:disabled { opacity: 0.4; cursor: not-allowed; }

        .eye-btn {
          position: absolute; right: 12px;
          background: none; border: none;
          cursor: pointer; font-size: 14px;
          color: rgba(255,255,255,0.25);
          padding: 2px 4px; line-height: 1;
        }

        .submit-btn {
          margin-top: 8px;
          width: 100%;
          background: linear-gradient(135deg, #0d7a68, #0f9e87);
          border: none; border-radius: 12px;
          padding: 14px 20px;
          font-size: 15px; font-weight: 700;
          font-family: 'Outfit', system-ui, sans-serif;
          color: #fff; cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 24px rgba(13,122,104,0.35), 0 1px 0 rgba(255,255,255,0.08) inset;
          letter-spacing: 0.2px;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 32px rgba(13,122,104,0.50);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .loading-row { display: flex; align-items: center; justify-content: center; gap: 9px; }
        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.25);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.65s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .card-footer {
          padding: 14px 28px;
          background: rgba(255,255,255,0.02);
          border-top: 1px solid rgba(255,255,255,0.05);
          text-align: center;
          font-size: 11px;
          color: rgba(255,255,255,0.18);
        }
      `}</style>
    </>
  );
}
