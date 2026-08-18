"use client";

import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react";
import BrandWordmark from "@/components/BrandWordmark";
import { Anchor } from "@/lib/uianchor";
import styles from "./Footer.module.css";

const quickLinks = [
  { label: "Home", href: "#", ui: "public.footer.link.home" as const },
  { label: "About Us", href: "#", ui: "public.footer.link.about" as const },
  { label: "Treatments", href: "#", ui: "public.footer.link.treatments" as const },
  { label: "Blog", href: "#", ui: "public.footer.link.blog" as const },
  { label: "Contact Us", href: "#", ui: "public.footer.link.contact" as const },
];

const treatmentLinks = [
  { label: "Dental", href: "#" },
  { label: "Skin", href: "#" },
  { label: "Hair", href: "#" },
  { label: "HNF Cancer", href: "#" },
  { label: "Facial Trauma", href: "#" },
  { label: "Body Shaping", href: "#" },
  { label: "Nutrition", href: "#" },
  { label: "Sexual Health", href: "#" },
  { label: "Premium Aesthetic", href: "#" },
  { label: "Dental and Medical Tourism", href: "#" },
];

const socialLinks = [
  { icon: <Facebook size={18} />, label: "Facebook", href: "#" },
  { icon: <Twitter size={18} />, label: "Twitter", href: "#" },
  { icon: <Instagram size={18} />, label: "Instagram", href: "#" },
  { icon: <Linkedin size={18} />, label: "LinkedIn", href: "#" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "#", ui: "public.footer.link.privacy" as const },
  { label: "Terms of Service", href: "#", ui: "public.footer.link.terms" as const },
  { label: "Cookie Policy", href: "#", ui: "public.footer.link.cookies" as const },
];

export default function Footer() {
  return (
    <footer id="contact" className={styles.footer} data-ui="public.footer">
      <div className={`container ${styles.footerContent} ${styles.footerNoNewsletter}`}>
        <div className={styles.footerCol}>
          <Anchor.Link
            ui="public.footer.link.logo"
            href="#"
            className={styles.footerLogo}
            style={{ display: "flex", alignItems: "center", textDecoration: "none" }}
            aria-label="curify home"
          >
            <BrandWordmark variant="light" />
          </Anchor.Link>
          <h5 className={styles.footerTagline}>Smarter Healthcare Platform</h5>
          <p className={styles.footerAbout}>
            Curify is a multi-tenant Hospital Management SaaS platform connecting doctors, patients, and administrators in one secure ecosystem.
          </p>
          <div className={styles.socialLinks}>
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                className={styles.socialLink}
                aria-label={social.label}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        <div className={styles.footerCol}>
          <h4 className={styles.colTitle}>Quick Links</h4>
          <ul className={styles.linkList}>
            <li><Anchor.Link ui="public.footer.link.home" href="#" className={styles.footerLink}><ArrowRight size={14} />Home</Anchor.Link></li>
            <li><Anchor.Link ui="public.footer.link.about" href="#" className={styles.footerLink}><ArrowRight size={14} />About Us</Anchor.Link></li>
            <li><Anchor.Link ui="public.footer.link.treatments" href="#" className={styles.footerLink}><ArrowRight size={14} />Treatments</Anchor.Link></li>
            <li><Anchor.Link ui="public.footer.link.blog" href="#" className={styles.footerLink}><ArrowRight size={14} />Blog</Anchor.Link></li>
            <li><Anchor.Link ui="public.footer.link.contact" href="#" className={styles.footerLink}><ArrowRight size={14} />Contact Us</Anchor.Link></li>
          </ul>
        </div>

        <div className={styles.footerCol}>
          <h4 className={styles.colTitle}>Our Treatments</h4>
          <ul className={styles.linkList}>
            {treatmentLinks.map((treatment) => (
              <li key={treatment.label}>
                <Link href={treatment.href} className={styles.footerLink}>
                  <ArrowRight size={14} />
                  {treatment.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.footerCol}>
          <h4 className={styles.colTitle}>Contact Info</h4>
          <div className={styles.contactList}>
            <div className={styles.contactItem}>
              <MapPin size={18} className={styles.contactIcon} />
              <span>
                3/Alampat Business Centre, Near cycle circle,
                <br />
                Krushi Nagar, college road, Nashik 422001
              </span>
            </div>
            <div className={styles.contactItem}>
              <Phone size={18} className={styles.contactIcon} />
              <span>+91 90590 53938</span>
            </div>
            <div className={styles.contactItem}>
              <Mail size={18} className={styles.contactIcon} />
              <span>support@medinexplus.com</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <div className={`container ${styles.bottomInner}`}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} Curify. All rights reserved.
          </p>
          <div className={styles.bottomLinks}>
            <Anchor.Link ui="public.footer.link.privacy" href="#">Privacy Policy</Anchor.Link>
            <Anchor.Link ui="public.footer.link.terms" href="#">Terms of Service</Anchor.Link>
            <Anchor.Link ui="public.footer.link.cookies" href="#">Cookie Policy</Anchor.Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
