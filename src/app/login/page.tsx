"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Anchor } from "@/lib/uianchor";
import BrandWordmark from "@/components/BrandWordmark";
import "./hospital-login.css";

type FpStep = "email" | "otp" | "password" | "done";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [success, setSuccess] = useState(false);
  const [trialPopup, setTrialPopup] = useState<{ type: string; message: string } | null>(null);

  const [fpOpen, setFpOpen] = useState(false);
  const [fpStep, setFpStep] = useState<FpStep>("email");
  const [fpEmail, setFpEmail] = useState("");
  const [fpEmailError, setFpEmailError] = useState("");
  const [fpOtp, setFpOtp] = useState(["", "", "", "", "", ""]);
  const [fpOtpError, setFpOtpError] = useState("");
  const [fpNewPw, setFpNewPw] = useState("");
  const [fpConfirmPw, setFpConfirmPw] = useState("");
  const [fpPwError, setFpPwError] = useState("");
  const [fpConfirmError, setFpConfirmError] = useState("");
  const [fpLoading, setFpLoading] = useState(false);
  const [fpApiError, setFpApiError] = useState("");
  const [showFpPw, setShowFpPw] = useState(false);
  const [showFpConfirm, setShowFpConfirm] = useState(false);

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Enter a valid email address";
    if (!password) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "Minimum 6 characters";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); setApiError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }), credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        const role = data.data?.user?.role;
        setTimeout(() => {
          if (role === "SUPER_ADMIN") {
            setApiError("Super Admin must sign in at /superadmin/login with the security key.");
            setSuccess(false);
            return;
          }
          if (role === "DOCTOR") router.push("/doctor/dashboard");
          else if (role === "RECEPTIONIST" || role === "STAFF") router.push("/staff/dashboard");
          else if (role === "SUB_DEPT_HEAD") router.push("/subdept/dashboard");
          else if (role === "FINANCE_HEAD") router.push("/finance/dashboard");
          else if (role === "DEPT_HEAD") router.push("/parentdept/dashboard");
          else router.push("/hospitaladmin/dashboard");
        }, 800);
      } else {
        const msg = data.message || "Invalid email or password.";
        const trialCodes = ["TRIAL_EXPIRED", "SUBSCRIPTION_EXPIRED", "ACCOUNT_SUSPENDED", "ACCOUNT_CANCELLED"];
        const matchedCode = trialCodes.find(code => msg.startsWith(code + "::"));
        if (matchedCode) {
          setTrialPopup({ type: matchedCode, message: msg.split("::")[1] });
        } else {
          setApiError(msg);
        }
      }
    } catch { setApiError("No internet connection. Please try again."); }
    finally { setLoading(false); }
  };

  const openFp = () => {
    setFpOpen(true); setFpStep("email"); setFpEmail(""); setFpEmailError("");
    setFpOtp(["","","","","",""]); setFpOtpError(""); setFpNewPw(""); setFpConfirmPw("");
    setFpPwError(""); setFpConfirmError(""); setFpApiError(""); setFpLoading(false);
  };
  const closeFp = () => setFpOpen(false);

  const handleFpSendOtp = async () => {
    if (!fpEmail) { setFpEmailError("Email is required"); return; }
    if (!/\S+@\S+\.\S+/.test(fpEmail)) { setFpEmailError("Enter a valid email address"); return; }
    setFpEmailError(""); setFpLoading(true); setFpApiError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) { setFpStep("otp"); }
      else setFpApiError(data.message || "Failed to send OTP.");
    } catch { setFpApiError("Network error."); }
    finally { setFpLoading(false); }
  };

  const handleFpOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const next = [...fpOtp]; next[index] = value.replace(/\D/g, ""); setFpOtp(next);
    setFpOtpError(""); setFpApiError("");
    if (value && index < 5) document.getElementById(`fp-otp-${index + 1}`)?.focus();
  };
  const handleFpOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !fpOtp[index] && index > 0)
      document.getElementById(`fp-otp-${index - 1}`)?.focus();
  };
  const handleFpOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) { setFpOtp(pasted.split("")); document.getElementById("fp-otp-5")?.focus(); }
    e.preventDefault();
  };

  const handleFpVerifyOtp = async () => {
    const otpStr = fpOtp.join("");
    if (otpStr.length !== 6) { setFpOtpError("Enter the complete 6-digit OTP"); return; }
    setFpLoading(true);
    try { setFpStep("password"); }
    finally { setFpLoading(false); }
  };

  const handleFpResetPassword = async () => {
    let hasErr = false;
    if (!fpNewPw || fpNewPw.length < 6) { setFpPwError("Minimum 6 characters"); hasErr = true; } else setFpPwError("");
    if (fpNewPw !== fpConfirmPw) { setFpConfirmError("Passwords do not match"); hasErr = true; } else setFpConfirmError("");
    if (hasErr) return;
    setFpLoading(true); setFpApiError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail, otp: fpOtp.join(""), newPassword: fpNewPw }),
      });
      const data = await res.json();
      if (res.ok && data.success) { setFpStep("done"); }
      else setFpApiError(data.message || "Password reset failed.");
    } catch { setFpApiError("Network error."); }
    finally { setFpLoading(false); }
  };

  const eyeIcon = (show: boolean) => show
    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

  return (
    <>
      <div className="mn-auth-page">
        <div className="mn-auth-bg1" />
        <div className="mn-auth-bg2" />

        <Link href="/" className="mn-auth-logo" aria-label="curify home">
          <BrandWordmark />
        </Link>

        <div className="mn-auth-card">
          <div className="mn-auth-badge">
            <span className="mn-auth-badge-dot" />
            Secure Access
          </div>
          <h1 className="mn-auth-title">Welcome back</h1>
          <p className="mn-auth-sub">Sign in to your hospital dashboard to continue managing your healthcare platform.</p>

          {apiError && (
            <div className="mn-auth-err">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {apiError}
            </div>
          )}
          {success && (
            <div className="mn-auth-suc">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Login successful! Redirecting...
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mn-field">
              <label className="mn-label" htmlFor="login-email">Email Address</label>
              <div className="mn-input-wrap">
                <Anchor.Input
                  ui="auth.login.email"
                  id="login-email"
                  type="email"
                  className={`mn-input${fieldErrors.email ? " err" : ""}`}
                  placeholder="admin@hospital.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setFieldErrors(f => ({...f, email: undefined})); setApiError(""); }}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {fieldErrors.email && <span className="mn-ferr">{fieldErrors.email}</span>}
            </div>

            <div className="mn-field">
              <div className="mn-field-row">
                <label className="mn-label" htmlFor="login-pw">Password</label>
                <button type="button" className="mn-forgot-btn" onClick={openFp}>Forgot password?</button>
              </div>
              <div className="mn-input-wrap">
                <Anchor.Input
                  ui="auth.login.password"
                  id="login-pw"
                  type={showPw ? "text" : "password"}
                  className={`mn-input${fieldErrors.password ? " err" : ""}`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setFieldErrors(f => ({...f, password: undefined})); setApiError(""); }}
                  autoComplete="current-password"
                />
                <button type="button" className="mn-eye" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                  {eyeIcon(showPw)}
                </button>
              </div>
              {fieldErrors.password && <span className="mn-ferr">{fieldErrors.password}</span>}
            </div>

            <Anchor.Button
              ui="auth.login.submit"
              type="submit"
              className="mn-auth-btn"
              disabled={loading || success}
            >
              {loading ? <span className="mn-spinner" /> : success ? "Redirecting..." : (
                <>Sign In <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
              )}
            </Anchor.Button>
          </form>

          <div className="mn-auth-divider">
            <div className="mn-auth-divider-line" />
            <span className="mn-auth-divider-text">New to MediNex+?</span>
            <div className="mn-auth-divider-line" />
          </div>

          <div className="mn-auth-footer" style={{marginTop: 14}}>
            <Link href="/signup">Register your hospital</Link>
            {" · "}
            <Link href="/">Back to Home</Link>
          </div>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {fpOpen && (
        <div className="mn-fp-overlay">
          <div className="mn-fp-backdrop" onClick={closeFp} />
          <div className="mn-fp-modal">
            <div className="mn-fp-topbar">
              <div className="mn-fp-topbar-left">
                <div className="mn-fp-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                </div>
                <span className="mn-fp-title">Reset Password</span>
              </div>
              <Anchor.Button className="mn-fp-close" ui="auth.forgot.close" onClick={closeFp}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </Anchor.Button>
            </div>

            {fpStep !== "done" && (
              <div className="mn-fp-steps">
                {[{label:"Email",n:1,key:"email"},{label:"OTP",n:2,key:"otp"},{label:"Password",n:3,key:"password"}].map((s, idx, arr) => {
                  const order: FpStep[] = ["email","otp","password","done"];
                  const curIdx = order.indexOf(fpStep);
                  const myIdx = order.indexOf(s.key as FpStep);
                  const cls = myIdx < curIdx ? "done" : myIdx === curIdx ? "active" : "inactive";
                  return (
                    <div key={s.key} style={{display:"flex",alignItems:"center",flex: idx < arr.length-1 ? 1 : 0}}>
                      <div className={`mn-fp-step ${cls}`}>
                        <div className="mn-fp-step-dot">{cls === "done" ? "✓" : s.n}</div>
                        <span className="mn-fp-step-label">{s.label}</span>
                      </div>
                      {idx < arr.length - 1 && <div className={`mn-fp-connector${cls === "done" ? " done" : ""}`} />}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mn-fp-body">
              {fpApiError && (
                <div className="mn-fp-api-err">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {fpApiError}
                </div>
              )}

              {fpStep === "email" && (
                <>
                  <p className="mn-fp-hint">Enter the email address linked to your account and we will send you a reset code.</p>
                  <label className="mn-label">Email Address</label>
                  <Anchor.Input
                    ui="auth.forgot.email"
                    id="forgot-email"
                    type="email"
                    className={`mn-input${fpEmailError ? " err" : ""}`}
                    style={{marginTop:6}}
                    placeholder="admin@hospital.com"
                    value={fpEmail}
                    onChange={e => { setFpEmail(e.target.value); setFpEmailError(""); setFpApiError(""); }}
                    autoFocus
                    onKeyDown={e => { if (e.key === "Enter") handleFpSendOtp(); }}
                  />
                  {fpEmailError && <span className="mn-ferr">{fpEmailError}</span>}
                  <Anchor.Button className="mn-fp-btn" ui="auth.forgot.send-otp" onClick={handleFpSendOtp} disabled={fpLoading}>
                    {fpLoading ? <span className="mn-spinner" /> : <>Send OTP <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>}
                  </Anchor.Button>
                </>
              )}

              {fpStep === "otp" && (
                <>
                  <p className="mn-fp-hint">A 6-digit code was sent to <strong style={{color:"#0F172A"}}>{fpEmail}</strong>.</p>
                  <label className="mn-label">Enter 6-digit OTP</label>
                  <div className="mn-fp-otp-wrap" style={{marginTop:10}}>
                    <div className="mn-fp-otp-grid" onPaste={handleFpOtpPaste}>
                      {fpOtp.map((digit, i) => (
                        <Anchor.Input
                          key={i}
                          id={`fp-otp-${i}`}
                          ui={`auth.forgot.otp-${i + 1}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          className={`mn-fp-otp-in${digit ? " filled" : ""}`}
                          value={digit}
                          onChange={e => handleFpOtpChange(i, e.target.value)}
                          onKeyDown={e => handleFpOtpKeyDown(i, e)}
                          autoFocus={i === 0}
                          autoComplete="one-time-code"
                        />
                      ))}
                    </div>
                  </div>
                  {fpOtpError && <span className="mn-ferr" style={{textAlign:"center",display:"block"}}>{fpOtpError}</span>}
                  <p className="mn-fp-otp-hint">Code is valid for 10 minutes</p>
                  <Anchor.Button className="mn-fp-btn" ui="auth.forgot.verify-otp" onClick={handleFpVerifyOtp} disabled={fpLoading || fpOtp.join("").length !== 6}>
                    {fpLoading ? <span className="mn-spinner" /> : <>Verify OTP <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>}
                  </Anchor.Button>
                  <p className="mn-fp-resend">
                    Didn&apos;t receive it?{" "}
                    <Anchor.Button className="mn-fp-resend-btn" ui="auth.forgot.resend-otp" onClick={() => { setFpOtp(["","","","","",""]); handleFpSendOtp(); }} disabled={fpLoading}>Resend OTP</Anchor.Button>
                  </p>
                </>
              )}

              {fpStep === "password" && (
                <>
                  <p className="mn-fp-hint">OTP verified ✓ — choose a new secure password.</p>
                  <div style={{marginBottom:14}}>
                    <label className="mn-label">New Password</label>
                    <div className="mn-fp-pw-wrap" style={{marginTop:6}}>
                      <Anchor.Input
                        ui="auth.forgot.password"
                        id="forgot-new-pw"
                        type={showFpPw ? "text" : "password"}
                        className={`mn-input${fpPwError ? " err" : ""}`}
                        style={{paddingRight:42}}
                        placeholder="Minimum 6 characters"
                        value={fpNewPw}
                        onChange={e => { setFpNewPw(e.target.value); setFpPwError(""); setFpApiError(""); }}
                        autoFocus
                      />
                      <button type="button" className="mn-fp-pw-eye" onClick={() => setShowFpPw(!showFpPw)}>{eyeIcon(showFpPw)}</button>
                    </div>
                    {fpPwError && <span className="mn-ferr">{fpPwError}</span>}
                  </div>
                  <div>
                    <label className="mn-label">Confirm New Password</label>
                    <div className="mn-fp-pw-wrap" style={{marginTop:6}}>
                      <Anchor.Input
                        ui="auth.forgot.confirm"
                        id="forgot-confirm-pw"
                        type={showFpConfirm ? "text" : "password"}
                        className={`mn-input${fpConfirmError ? " err" : ""}`}
                        style={{paddingRight:42}}
                        placeholder="Re-enter new password"
                        value={fpConfirmPw}
                        onChange={e => { setFpConfirmPw(e.target.value); setFpConfirmError(""); setFpApiError(""); }}
                        onKeyDown={e => { if (e.key === "Enter") handleFpResetPassword(); }}
                      />
                      <button type="button" className="mn-fp-pw-eye" onClick={() => setShowFpConfirm(!showFpConfirm)}>{eyeIcon(showFpConfirm)}</button>
                    </div>
                    {fpConfirmError && <span className="mn-ferr">{fpConfirmError}</span>}
                  </div>
                  <Anchor.Button className="mn-fp-btn" ui="auth.forgot.submit" onClick={handleFpResetPassword} disabled={fpLoading}>
                    {fpLoading ? <span className="mn-spinner" /> : <>Reset Password <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>}
                  </Anchor.Button>
                </>
              )}

              {fpStep === "done" && (
                <div className="mn-fp-success">
                  <div className="mn-fp-suc-icon">🎉</div>
                  <div className="mn-fp-suc-title">Password Reset!</div>
                  <p className="mn-fp-suc-sub">Your password has been updated successfully. You can now sign in with your new password.</p>
                  <Anchor.Button className="mn-fp-suc-btn" ui="auth.forgot.go-to-signin" onClick={closeFp}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    Go to Sign In
                  </Anchor.Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TRIAL / SUBSCRIPTION EXPIRED POPUP */}
      {trialPopup && (
        <div className="mn-fp-overlay">
          <div className="mn-fp-backdrop" onClick={() => setTrialPopup(null)} />
          <div className="mn-fp-modal" style={{ maxWidth: 420 }}>
            <div className="mn-fp-topbar" style={{ borderBottom: "1px solid #FEE2E2" }}>
              <div className="mn-fp-topbar-left">
                <div className="mn-fp-icon" style={{ background: trialPopup.type === "TRIAL_EXPIRED" ? "#FEF3C7" : "#FEE2E2" }}>
                  {trialPopup.type === "TRIAL_EXPIRED" ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  )}
                </div>
                <span className="mn-fp-title" style={{ color: trialPopup.type === "TRIAL_EXPIRED" ? "#92400E" : "#991B1B" }}>
                  {trialPopup.type === "TRIAL_EXPIRED" && "Free Trial Ended"}
                  {trialPopup.type === "SUBSCRIPTION_EXPIRED" && "Subscription Expired"}
                  {trialPopup.type === "ACCOUNT_SUSPENDED" && "Account Suspended"}
                  {trialPopup.type === "ACCOUNT_CANCELLED" && "Account Cancelled"}
                </span>
              </div>
              <button className="mn-fp-close" onClick={() => setTrialPopup(null)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="mn-fp-body" style={{ textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: trialPopup.type === "TRIAL_EXPIRED" ? "#FEF3C7" : "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>
                {trialPopup.type === "TRIAL_EXPIRED" ? "⏰" : trialPopup.type === "ACCOUNT_SUSPENDED" ? "🔒" : "⚠️"}
              </div>
              <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.7, marginBottom: 20 }}>
                {trialPopup.message}
              </p>
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, textAlign: "left", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Contact Support</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7"/></svg>
                  <a href="mailto:support@medinexplus.com" style={{ fontSize: 13, color: "#7C3AED", fontWeight: 600, textDecoration: "none" }}>support@medinexplus.com</a>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                  <a href="tel:+919876543210" style={{ fontSize: 13, color: "#7C3AED", fontWeight: 600, textDecoration: "none" }}>+91-9876543210</a>
                </div>
              </div>
              <button onClick={() => setTrialPopup(null)} style={{ width: "100%", padding: 12, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: "'Inter', sans-serif", cursor: "pointer", background: "linear-gradient(135deg, #7C3AED, #6D28D9)", color: "#fff", boxShadow: "0 3px 12px rgba(124,58,237,0.25)", transition: "all 0.15s" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
