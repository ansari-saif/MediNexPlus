"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Anchor } from "@/lib/uianchor";
import "./superadmin-login.css";

export default function SuperAdminLogin() {
  const router = useRouter();
  const [dark, setDark] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    securityKey: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/superadmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push("/superadmin/dashboard");
      } else {
        setError(data.message || "Authentication failed. Please verify credentials.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const t = dark ? "dark" : "light";

  return (
    <>
      {/* Theme Toggle */}
      <button className="sa-toggle" onClick={() => setDark(!dark)} title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
        {dark ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        ) : (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
          </svg>
        )}
      </button>

      <div className={`sa-page ${t}`}>
        <div className="sa-bg-grid" />
        <div className="sa-bg-glow-1" />
        <div className="sa-bg-glow-2" />

        <div className="sa-card">
          {/* Badge */}
          <div className="sa-badge">
            <span className="sa-badge-dot" />
            Restricted System Access
          </div>

          {/* Header */}
          <h1 className="sa-title">
            Hospital <span>Root</span> Portal
          </h1>
          <p className="sa-subtitle">
            Multi-tenant system administration. Three-factor authentication required.
          </p>

          <div className="sa-divider" />

          {/* Warning */}
          <div className="sa-warning">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{flexShrink:0}}>
              <path d="M12 2L1 21h22L12 2zm0 3.5L20.5 19h-17L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
            </svg>
            All login attempts are logged and monitored.
          </div>

          {/* Error */}
          {error && (
            <div className="sa-error">
              <svg className="sa-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="sa-field">
              <label className="sa-label">Admin Email</label>
              <div className="sa-input-wrap">
                <Anchor.Input
                  ui="auth.superadmin.login.email"
                  id="sa-email"
                  type="email"
                  required
                  autoComplete="email"
                  className="sa-input"
                  placeholder="systemadmin@hospital.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <button type="button" className="sa-input-icon" tabIndex={-1}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="sa-field">
              <label className="sa-label">Root Password</label>
              <div className="sa-input-wrap">
                <Anchor.Input
                  ui="auth.superadmin.login.password"
                  id="sa-password"
                  type={showPw ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  className="sa-input"
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  className="sa-input-icon"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="sa-field">
              <label className="sa-label">Security Key</label>
              <div className="sa-input-wrap">
                <Anchor.Input
                  ui="auth.superadmin.login.security-key"
                  id="sa-security-key"
                  type={showKey ? "text" : "password"}
                  required
                  className="sa-input"
                  placeholder="••••••••"
                  value={formData.securityKey}
                  onChange={(e) => setFormData({ ...formData, securityKey: e.target.value })}
                />
                <button
                  type="button"
                  className="sa-input-icon"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <Anchor.Button type="submit" className="sa-btn" ui="auth.superadmin.login.submit" disabled={loading}>
              <span className="sa-btn-shine" />
              {loading ? (
                <>
                  <span className="sa-spinner" />
                  Authenticating...
                </>
              ) : (
                "Authenticate & Enter System"
              )}
            </Anchor.Button>
          </form>

          {/* Footer */}
          <div className="sa-footer">
            <strong>Hospital Management System v1.0</strong>
            © 2026 All rights reserved · Unauthorized access is prohibited
          </div>
        </div>
      </div>
    </>
  );
}
