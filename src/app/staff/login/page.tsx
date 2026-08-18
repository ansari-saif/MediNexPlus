"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Anchor } from "@/lib/uianchor";
import "./staff-login.css";

export default function StaffLoginPage() {
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Enter a valid email address";
    if (!password) errs.password = "Password is required";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError("");
    try {
      const res = await fetch("/api/auth/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        const mustChange = data.data?.staff?.mustChangePassword;
        setTimeout(() => {
          if (mustChange) {
            router.push("/staff/change-password");
          } else {
            router.push("/staff/dashboard");
          }
        }, 800);
      } else {
        setApiError(data.message || "Invalid email or password.");
      }
    } catch {
      setApiError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const t = dark ? "dark" : "light";

  return (
    <>
      <button className="sp-toggle" onClick={() => setDark(!dark)} title={dark ? "Light Mode" : "Dark Mode"}>
        {dark
          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
        }
      </button>

      <div className={`sp ${t}`}>
        {/* ── BRAND ── */}
        <div className="sp-brand">
          <div className="sp-brand-grid"/>
          <div className="sp-brand-glow"/>
          <div className="sp-brand-content">
            <Link href="/" className="sp-logo">
              <div className="sp-logo-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
              <span className="sp-logo-text">Medi<span className="sp-logo-accent">Care+</span></span>
            </Link>
            <h1 className="sp-brand-title">Staff<br /><span>Portal</span></h1>
            <p className="sp-brand-sub">Access your hospital staff dashboard. Manage your tasks, view schedules, and stay connected with the hospital team.</p>
            <div className="sp-stats">
              <div className="sp-stat"><span className="sp-stat-num">24/7</span><span className="sp-stat-label">Access</span></div>
              <div className="sp-stat-div"/>
              <div className="sp-stat"><span className="sp-stat-num">100%</span><span className="sp-stat-label">Secure</span></div>
              <div className="sp-stat-div"/>
              <div className="sp-stat"><span className="sp-stat-num">Live</span><span className="sp-stat-label">Updates</span></div>
            </div>
            <div className="sp-pills">
              {["Nurse","Receptionist","Pharmacist","Lab Technician","Accountant"].map(r=><span key={r} className="sp-pill">{r}</span>)}
            </div>
          </div>
        </div>

        {/* ── FORM SIDE ── */}
        <div className="sp-form-side">
          <div className="sp-form-box">
            <div className="sp-badge">
              <span style={{width:6,height:6,borderRadius:"50%",background:"#10b981",boxShadow:"0 0 6px #10b981"}}/>
              Staff Access
            </div>
            <h2 className="sp-heading">Staff Sign In</h2>
            <p className="sp-sub">Enter the credentials sent to your email by the hospital administrator.</p>

            {apiError && (
              <div className="sp-err">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {apiError}
              </div>
            )}
            {success && (
              <div className="sp-suc">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Login successful! Redirecting...
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="sp-field">
                <label className="sp-label" htmlFor="staff-email">Email Address</label>
                <div className="sp-wrap">
                  <Anchor.Input
                    ui="auth.staff.login.email"
                    id="staff-email"
                    type="email"
                    className={`sp-input${fieldErrors.email ? " err" : ""}`}
                    placeholder="your.email@hospital.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setFieldErrors(f => ({...f, email: undefined})); setApiError(""); }}
                    autoComplete="email"
                    autoFocus
                  />
                  <button type="button" className="sp-eye" tabIndex={-1}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </button>
                </div>
                {fieldErrors.email && <span className="sp-ferr">{fieldErrors.email}</span>}
              </div>

              <div className="sp-field">
                <div className="sp-label-row">
                  <label className="sp-label" htmlFor="staff-pw">Password</label>
                </div>
                <div className="sp-wrap">
                  <Anchor.Input
                    ui="auth.staff.login.password"
                    id="staff-pw"
                    type={showPw ? "text" : "password"}
                    className={`sp-input${fieldErrors.password ? " err" : ""}`}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setFieldErrors(f => ({...f, password: undefined})); setApiError(""); }}
                    autoComplete="current-password"
                  />
                  <button type="button" className="sp-eye" onClick={() => setShowPw(!showPw)}>
                    {showPw
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                {fieldErrors.password && <span className="sp-ferr">{fieldErrors.password}</span>}
              </div>

              <Anchor.Button type="submit" className="sp-btn" ui="auth.staff.login.submit" disabled={loading || success}>
                <span className="sp-btn-shine"/>
                {loading
                  ? <span className="sp-spinner"/>
                  : success
                  ? "Redirecting..."
                  : <>Sign In <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
                }
              </Anchor.Button>
            </form>

            <div className="sp-notice">
              <strong>First time logging in?</strong> Use the temporary password sent to your email. You will be asked to change it immediately after login.
            </div>

            <p className="sp-footer">
              Not a staff member? <Link href="/login">Hospital Admin Login</Link> · <Link href="/">Back to Home</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
