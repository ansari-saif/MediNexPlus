"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Calendar, ArrowRight } from "lucide-react";
import styles from "../policy.module.css";

const PURPLE = "#7C3AED";
const PURPLE_DARK = "#6D28D9";
const PURPLE_200 = "#DDD6FE";
const PURPLE_50 = "#F5F3FF";
const DARK = "#0F172A";
const GRAY = "#64748B";

export default function TermsOfServicePage() {
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
                <FileText size={16} />
                Terms of Service
              </div>
              <h1 className={styles.heroTitle}>Terms of Service</h1>
              <p className={styles.heroSubtitle}>
                These Terms govern your subscription and use of the MediNex+ Hospital Management SaaS Platform.
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
              <div className={styles.toc}>
                <h3 className={styles.tocTitle}>Table of Contents</h3>
                <ul className={styles.tocList}>
                  <li className={styles.tocItem}><a href="#acceptance" className={styles.tocLink}>Acceptance of Terms</a></li>
                  <li className={styles.tocItem}><a href="#services" className={styles.tocLink}>SaaS Services</a></li>
                  <li className={styles.tocItem}><a href="#user-obligations" className={styles.tocLink}>Client Obligations</a></li>
                  <li className={styles.tocItem}><a href="#payment" className={styles.tocLink}>Billing & Subscriptions</a></li>
                  <li className={styles.tocItem}><a href="#data" className={styles.tocLink}>Data & Privacy</a></li>
                  <li className={styles.tocItem}><a href="#limitation" className={styles.tocLink}>Limitation of Liability</a></li>
                  <li className={styles.tocItem}><a href="#modifications" className={styles.tocLink}>Modifications</a></li>
                  <li className={styles.tocItem}><a href="#contact" className={styles.tocLink}>Contact Us</a></li>
                </ul>
              </div>

              {/* 1. Acceptance */}
              <div id="acceptance" className={styles.section}>
                <h2 className={styles.sectionTitle}>1. Acceptance of Terms</h2>
                <p className={styles.sectionText}>
                  By creating an account, subscribing to, or using the MediNex+ SaaS platform, you (the "Hospital" or "Client") agree to these Terms of Service. If you do not agree, you must not use our software.
                </p>
              </div>

              {/* 2. Services */}
              <div id="services" className={styles.section}>
                <h2 className={styles.sectionTitle}>2. SaaS Services</h2>
                <p className={styles.sectionText}>
                  MediNex+ provides a cloud-based hospital management system including modules for OPD, IPD, Billing, Pharmacy, and AI Prescriptions.
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}>We guarantee a 99.9% uptime SLA for Enterprise customers.</li>
                  <li className={styles.listItem}>Features available depend on your active subscription tier.</li>
                </ul>
              </div>

              {/* 3. Client Obligations */}
              <div id="user-obligations" className={styles.section}>
                <h2 className={styles.sectionTitle}>3. Client Obligations</h2>
                <ul className={styles.list}>
                  <li className={styles.listItem}>You are responsible for the accuracy of all medical data entered into the system.</li>
                  <li className={styles.listItem}>You must maintain the confidentiality of admin and staff credentials.</li>
                  <li className={styles.listItem}>You agree not to reverse engineer or attempt to breach the security of the SaaS platform.</li>
                </ul>
              </div>

              {/* 4. Billing */}
              <div id="payment" className={styles.section}>
                <h2 className={styles.sectionTitle}>4. Billing & Subscriptions</h2>
                <ul className={styles.list}>
                  <li className={styles.listItem}>Subscriptions are billed on a recurring monthly or annual basis.</li>
                  <li className={styles.listItem}>Failure to pay may result in account suspension after a 15-day grace period.</li>
                  <li className={styles.listItem}>You may cancel your subscription at any time; however, prepaid fees are non-refundable.</li>
                </ul>
              </div>

              {/* 5. Data & Privacy */}
              <div id="data" className={styles.section}>
                <h2 className={styles.sectionTitle}>5. Data & Privacy</h2>
                <p className={styles.sectionText}>
                  You retain full ownership of all patient data. MediNex+ acts solely as a data processor. Please refer to our <a href="/privacy-policy" className={styles.contactLink}>Privacy Policy</a> for more details on how we protect your data.
                </p>
              </div>

              {/* 6. Limitation */}
              <div id="limitation" className={styles.section}>
                <h2 className={styles.sectionTitle}>6. Limitation of Liability</h2>
                <p className={styles.sectionText}>
                  MediNex+ provides software tools, not medical advice. We are not liable for medical errors, misdiagnoses, or patient outcomes resulting from the use or misuse of our software.
                </p>
                <p className={styles.sectionText}>
                  Our total liability shall not exceed the amount paid for the software subscription in the 12 months preceding the claim.
                </p>
              </div>

              {/* 7. Contact Us */}
              <div id="contact" className={styles.section}>
                <h2 className={styles.sectionTitle}>7. Contact Us</h2>
                <ul className={styles.list}>
                  <li className={styles.listItem}><strong>Email:</strong> <a href="mailto:legal@medinexplus.com" className={styles.contactLink}>legal@medinexplus.com</a></li>
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
