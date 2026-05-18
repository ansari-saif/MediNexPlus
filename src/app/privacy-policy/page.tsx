"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, Calendar, ArrowRight } from "lucide-react";
import styles from "../policy.module.css";

const PURPLE = "#7C3AED";
const PURPLE_DARK = "#6D28D9";
const PURPLE_200 = "#DDD6FE";
const PURPLE_50 = "#F5F3FF";
const DARK = "#0F172A";
const GRAY = "#64748B";

export default function PrivacyPolicyPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        .mn-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; padding: 0 5%; transition: all 0.3s; font-family: 'Inter', sans-serif; }
        .mn-nav.scrolled { background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); box-shadow: 0 1px 32px rgba(124,58,237,0.08); }
        .mn-nav-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 18px 0; }
        .mn-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .mn-nav-links { display: flex; align-items: center; gap: 32px; }
        .mn-nav-links a { font-size: 14px; font-weight: 500; color: ${GRAY}; text-decoration: none; transition: color 0.2s; }
        .mn-nav-links a:hover { color: ${PURPLE}; }
        .mn-nav-cta { display: flex; align-items: center; gap: 12px; }
        .mn-btn-ghost { padding: 6px 18px; font-size: 13px; font-weight: 600; color: ${PURPLE}; background: transparent; border: 1.5px solid ${PURPLE_200}; border-radius: 8px; cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif; text-decoration: none; }
        .mn-btn-ghost:hover { background: ${PURPLE_50}; border-color: ${PURPLE}; }
        .mn-btn-free-trial { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 9px 22px; font-size: 13px; font-weight: 600; color: #fff; background: #DC2626; border: none; border-radius: 8px; cursor: pointer; text-decoration: none; position: relative; overflow: hidden; text-transform: lowercase; letter-spacing: 0.05em; transition: all 0.2s; font-family: 'Inter', sans-serif; }
        .mn-btn-free-trial:hover { transform: translateY(-2px); background: #B91C1C; }
        .mn-burger { display: none; flex-direction: column; gap: 5px; cursor: pointer; background: none; border: none; padding: 8px; position: relative; z-index: 1001; }
        .mn-burger span { display: block; width: 24px; height: 2.5px; background: ${DARK}; border-radius: 2px; transition: all 0.3s ease; }
        .mn-burger.open span:nth-child(1) { transform: rotate(45deg) translateY(8px); }
        .mn-burger.open span:nth-child(2) { opacity: 0; transform: translateX(-10px); }
        .mn-burger.open span:nth-child(3) { transform: rotate(-45deg) translateY(-8px); }
        .mn-mobile-menu { position: fixed; top: 0; right: -100%; bottom: 0; width: 320px; background: rgba(255,255,255,0.98); backdrop-filter: blur(20px); z-index: 1000; padding: 100px 24px 24px; display: flex; flex-direction: column; gap: 16px; transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: -10px 0 40px rgba(0,0,0,0.05); border-left: 1px solid rgba(255,255,255,0.5); }
        .mn-mobile-menu.open { right: 0; }
        .mn-mobile-menu a { font-size: 16px; font-weight: 600; color: ${DARK}; text-decoration: none; padding: 12px 16px; border-radius: 12px; transition: all 0.2s; }
        .mn-mobile-menu a:hover { background: #F8FAFC; color: ${PURPLE}; transform: translateX(4px); }
        .mn-mobile-menu-divider { height: 1px; background: linear-gradient(90deg, transparent, #F1F5F9, transparent); margin: 8px 0; }
        .mn-mobile-menu-buttons { display: flex; flex-direction: column; gap: 12px; padding: 0 16px; margin-top: auto; }
        .mn-mobile-menu-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,0.3); backdrop-filter: blur(4px); z-index: 999; opacity: 0; pointer-events: none; transition: opacity 0.3s; }
        .mn-mobile-menu-backdrop.open { opacity: 1; pointer-events: auto; }

        .mn-footer { background: ${DARK}; padding: 72px 5% 32px; font-family: 'Inter', sans-serif; }
        .mn-footer-inner { max-width: 1200px; margin: 0 auto; }
        .mn-footer-top { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 40px; margin-bottom: 48px; }
        .mn-footer-brand { max-width: 340px; }
        .mn-footer-brand p { font-size: 14px; color: #94A3B8; line-height: 1.7; margin-top: 16px; }
        .mn-footer-col-title { font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 20px; letter-spacing: 0.05em; text-transform: uppercase; }
        .mn-footer-links { display: flex; flex-direction: column; gap: 12px; }
        .mn-footer-links a { font-size: 14px; color: #94A3B8; text-decoration: none; transition: color 0.2s; }
        .mn-footer-links a:hover { color: #fff; }
        .mn-footer-divider { height: 1px; background: rgba(255,255,255,0.1); margin-bottom: 24px; }
        .mn-footer-bottom { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; }
        .mn-footer-copy { font-size: 13px; color: #64748B; }
        .mn-footer-legal { display: flex; gap: 24px; }
        .mn-footer-legal a { font-size: 13px; color: #64748B; text-decoration: none; transition: color 0.2s; }
        .mn-footer-legal a:hover { color: #94A3B8; }

        @media (max-width: 900px) {
          .mn-nav-links, .mn-nav-cta { display: none; }
          .mn-burger { display: flex; }
        }
        `
      }} />

      {/* NAVBAR */}
      <nav className={`mn-nav${scrolled ? " scrolled" : ""}`}>
        <div className="mn-nav-inner">
          <Link href="/" className="mn-logo">
            <img src="/logo/medinexplus-logo-normal.png" alt="MediNexPlus" className="mn-logo-img" style={{ height: 38, width: "auto", objectFit: "contain" }} />
          </Link>

          <div className="mn-nav-links">
            <Link href="/#solutions">Solutions</Link>
            <Link href="/#ai-prescription">AI Rx</Link>
            <Link href="/#features">Features</Link>
            <Link href="/#pricing">Pricing</Link>
            <Link href="/#faq">FAQ</Link>
          </div>

          <div className="mn-nav-cta">
            <Link href="/login" className="mn-btn-ghost">Sign In</Link>
            <Link href="/signup" className="mn-btn-free-trial">free 14 days trial</Link>
          </div>

          <button className={`mn-burger${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            <span /><span /><span />
          </button>
        </div>
        
        <div className={`mn-mobile-menu-backdrop${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(false)} />
        
        <div className={`mn-mobile-menu${menuOpen ? ' open' : ''}`}>
          <Link href="/#solutions" onClick={() => setMenuOpen(false)}>Solutions</Link>
          <Link href="/#ai-prescription" onClick={() => setMenuOpen(false)}>AI Rx</Link>
          <Link href="/#features" onClick={() => setMenuOpen(false)}>Features</Link>
          <Link href="/#pricing" onClick={() => setMenuOpen(false)}>Pricing</Link>
          <Link href="/#faq" onClick={() => setMenuOpen(false)}>FAQ</Link>
          <div className="mn-mobile-menu-divider" />
          <div className="mn-mobile-menu-buttons">
            <Link href="/login" className="mn-btn-ghost" onClick={() => setMenuOpen(false)}>Sign In</Link>
            <Link href="/signup" className="mn-btn-free-trial" onClick={() => setMenuOpen(false)}>Free Trial</Link>
          </div>
        </div>
      </nav>

      <main className={styles.page}>
        {/* Hero */}
        <section className={styles.hero} style={{ paddingTop: "120px" }}>
          <div className="container">
            <div className={styles.heroInner}>
              <div className={styles.heroBadge}>
                <Shield size={16} />
                Privacy Policy
              </div>
              <h1 className={styles.heroTitle}>Your Privacy Matters to Us</h1>
              <p className={styles.heroSubtitle}>
                At MediNex+, we are committed to protecting the privacy of healthcare providers, their staff, and their patients. This policy outlines how we handle B2B data securely.
              </p>
              <div className={styles.lastUpdated}>
                <Calendar size={14} />
                Last updated: May 18, 2026
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className={styles.content}>
          <div className="container">
            <div className={styles.contentInner}>
              {/* Table of Contents */}
              <div className={styles.toc}>
                <h3 className={styles.tocTitle}>Table of Contents</h3>
                <ul className={styles.tocList}>
                  <li className={styles.tocItem}><a href="#info-collect" className={styles.tocLink}>Information We Collect</a></li>
                  <li className={styles.tocItem}><a href="#how-use" className={styles.tocLink}>How We Use Your Information</a></li>
                  <li className={styles.tocItem}><a href="#info-share" className={styles.tocLink}>How We Share Your Information</a></li>
                  <li className={styles.tocItem}><a href="#data-security" className={styles.tocLink}>Data Security & HIPAA</a></li>
                  <li className={styles.tocItem}><a href="#data-retention" className={styles.tocLink}>Data Retention</a></li>
                  <li className={styles.tocItem}><a href="#your-rights" className={styles.tocLink}>Your Rights</a></li>
                  <li className={styles.tocItem}><a href="#cookies" className={styles.tocLink}>Cookies & Tracking</a></li>
                  <li className={styles.tocItem}><a href="#changes" className={styles.tocLink}>Changes to This Policy</a></li>
                  <li className={styles.tocItem}><a href="#contact" className={styles.tocLink}>Contact Us</a></li>
                </ul>
              </div>

              {/* 1. Information We Collect */}
              <div id="info-collect" className={styles.section}>
                <h2 className={styles.sectionTitle}>1. Information We Collect</h2>
                <p className={styles.sectionText}>
                  As a Hospital Management Software (SaaS) provider, MediNex+ collects information necessary to provide services to our hospital clients (B2B).
                </p>
                <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: 600, color: "var(--gray-800)", marginBottom: "var(--space-3)" }}>
                  Account & Hospital Information
                </h3>
                <ul className={styles.list}>
                  <li className={styles.listItem}>Hospital name, registration details, and administrative contact information.</li>
                  <li className={styles.listItem}>Admin names, emails, and phone numbers.</li>
                  <li className={styles.listItem}>Billing and subscription payment information.</li>
                </ul>
                <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: 600, color: "var(--gray-800)", marginBottom: "var(--space-3)", marginTop: "var(--space-6)" }}>
                  Patient Data (Processed on Behalf of Hospitals)
                </h3>
                <ul className={styles.list}>
                  <li className={styles.listItem}>Medical records, appointments, prescriptions, and billing info entered by the hospital staff.</li>
                  <li className={styles.listItem}>We act solely as a <strong>data processor</strong> for patient information. The hospital remains the <strong>data controller</strong>.</li>
                </ul>
              </div>

              {/* 2. How We Use Your Information */}
              <div id="how-use" className={styles.section}>
                <h2 className={styles.sectionTitle}>2. How We Use Your Information</h2>
                <ul className={styles.list}>
                  <li className={styles.listItem}>To provision and manage your SaaS workspace and multi-tenant environment.</li>
                  <li className={styles.listItem}>To process subscription billing and issue invoices.</li>
                  <li className={styles.listItem}>To provide technical support, maintenance, and platform updates.</li>
                  <li className={styles.listItem}>To monitor infrastructure performance and prevent fraud.</li>
                  <li className={styles.listItem}>We <strong>never</strong> use patient health data for marketing or analytics purposes.</li>
                </ul>
              </div>

              {/* 3. How We Share Your Information */}
              <div id="info-share" className={styles.section}>
                <h2 className={styles.sectionTitle}>3. How We Share Your Information</h2>
                <p className={styles.sectionText}>
                  We strictly limit data sharing. We only share information with:
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}>
                    <strong>Cloud Infrastructure Partners:</strong> E.g., AWS, for secure hosting of the SaaS platform.
                  </li>
                  <li className={styles.listItem}>
                    <strong>Payment Gateways:</strong> To process your SaaS subscription payments securely.
                  </li>
                  <li className={styles.listItem}>
                    <strong>Legal Requirements:</strong> When compelled by law, regulation, or legal process.
                  </li>
                </ul>
              </div>

              {/* 4. Data Security */}
              <div id="data-security" className={styles.section}>
                <h2 className={styles.sectionTitle}>4. Data Security & HIPAA Compliance</h2>
                <p className={styles.sectionText}>
                  Security is our top priority. We implement enterprise-grade protections for all healthcare data.
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}>End-to-end AES-256 encryption for data at rest and TLS for data in transit.</li>
                  <li className={styles.listItem}>Strict role-based access control (RBAC) and data isolation between hospital tenants.</li>
                  <li className={styles.listItem}>Regular third-party security audits and penetration testing.</li>
                  <li className={styles.listItem}>Execution of Business Associate Agreements (BAAs) with eligible healthcare entities to ensure HIPAA compliance.</li>
                </ul>
              </div>

              {/* 5. Data Retention */}
              <div id="data-retention" className={styles.section}>
                <h2 className={styles.sectionTitle}>5. Data Retention</h2>
                <ul className={styles.list}>
                  <li className={styles.listItem}>Hospital account data is retained as long as the subscription is active.</li>
                  <li className={styles.listItem}>If a subscription is canceled, patient data can be exported by the hospital. All data is then securely permanently deleted within 90 days.</li>
                </ul>
              </div>

              {/* 6. Contact Us */}
              <div id="contact" className={styles.section}>
                <h2 className={styles.sectionTitle}>6. Contact Us</h2>
                <p className={styles.sectionText}>
                  If you have questions about this policy or need to execute a BAA, please contact our privacy officer:
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}><strong>Email:</strong> <a href="mailto:privacy@medinexplus.com" className={styles.contactLink}>privacy@medinexplus.com</a></li>
                  <li className={styles.listItem}><strong>Address:</strong> 3/Alampat Business Centre, Near Cycle Circle, Krushi Nagar, Nashik 422001</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="mn-footer">
        <div className="mn-footer-inner">
          <div className="mn-footer-top">
            <div className="mn-footer-brand">
              <Link href="/" className="mn-logo">
                <img src="/logo/medinexplus-logo-white.png" alt="MediNexPlus" style={{ height: 36, width: "auto", objectFit: "contain" }} />
              </Link>
              <p>Smarter healthcare connecting doctors and patients. The multi-tenant HMS SaaS platform for modern healthcare providers.</p>
            </div>
            <div>
              <div className="mn-footer-col-title">Product</div>
              <div className="mn-footer-links">
                <Link href="/#solutions">Solutions</Link>
                <Link href="/#features">Features</Link>
                <Link href="/#pricing">Pricing</Link>
                <Link href="/signup">Get Started</Link>
              </div>
            </div>
            <div>
              <div className="mn-footer-col-title">Company</div>
              <div className="mn-footer-links">
                <Link href="/#">About Us</Link>
                <Link href="/#">Blog</Link>
                <Link href="/#">Careers</Link>
                <Link href="/contact">Contact</Link>
              </div>
            </div>
            <div>
              <div className="mn-footer-col-title">Legal</div>
              <div className="mn-footer-links">
                <Link href="/privacy-policy">Privacy Policy</Link>
                <Link href="/terms-of-service">Terms of Service</Link>
                <Link href="/cookie-policy">Cookie Policy</Link>
              </div>
            </div>
          </div>
          <div className="mn-footer-divider" />
          <div className="mn-footer-bottom">
            <p className="mn-footer-copy">© {new Date().getFullYear()} MediNex+. All rights reserved. | Product By <a href="https://theblueintellect.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#A78BFA', textDecoration: 'none', fontWeight: 600 }}>The Blue Intellect</a></p>
            <div className="mn-footer-legal">
              <Link href="/privacy-policy">Privacy</Link>
              <Link href="/terms-of-service">Terms</Link>
              <Link href="/cookie-policy">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
