"use client";

import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Footer() {
  const footerLinks = {
    product: [
      { name: "Features", href: "#features" },
      { name: "How It Works", href: "#how-it-works" },
      { name: "Pricing", href: "#pricing" },
      { name: "Changelog", href: "#" }
    ],
    resources: [
      { name: "Documentation", href: "#" },
      { name: "API Reference", href: "#" },
      { name: "Blog & Guides", href: "#" },
      { name: "Community", href: "#" }
    ],
    company: [
      { name: "About Us", href: "#" },
      { name: "Contact", href: "#" },
      { name: "Privacy Policy", href: "#" },
      { name: "Terms of Service", href: "#" }
    ]
  };

  return (
    <footer className="bg-[#FAF7F2] border-t border-[#E6E0D6] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          
          {/* Brand Col */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0D9488] via-[#2563EB] to-[#7C3AED] p-0.5 shadow-sm">
                <div className="w-full h-full bg-[#FAF7F2] rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#0D9488]" />
                </div>
              </div>
              <span className="font-bold text-lg text-[#1C1917] font-['Plus_Jakarta_Sans'] tracking-tight">
                StudySpace<span className="text-[#0D9488]">.AI</span>
              </span>
            </Link>

            <p className="text-xs text-[#78716C] max-w-sm leading-relaxed">
              The modern AI-powered workspace for students, researchers, and educators. Transform lectures and documents into structured knowledge.
            </p>

            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C1917] font-['Plus_Jakarta_Sans']">Product</h4>
            <ul className="space-y-2 text-xs text-[#78716C]">
              {footerLinks.product.map((item) => (
                <li key={item.name}>
                  <a href={item.href} className="hover:text-[#0D9488] transition-colors">{item.name}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C1917] font-['Plus_Jakarta_Sans']">Resources</h4>
            <ul className="space-y-2 text-xs text-[#78716C]">
              {footerLinks.resources.map((item) => (
                <li key={item.name}>
                  <a href={item.href} className="hover:text-[#0D9488] transition-colors">{item.name}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C1917] font-['Plus_Jakarta_Sans']">Company</h4>
            <ul className="space-y-2 text-xs text-[#78716C]">
              {footerLinks.company.map((item) => (
                <li key={item.name}>
                  <a href={item.href} className="hover:text-[#0D9488] transition-colors">{item.name}</a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom Copyright & Social */}
        <div className="pt-8 border-t border-[#E6E0D6] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#78716C]">
          <p>© {new Date().getFullYear()} StudySpace AI. Built with Linear & Vercel aesthetics.</p>

          <div className="flex items-center gap-3">
            {/* GitHub SVG */}
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-[#FFFDF9] border border-[#E6E0D6] text-[#78716C] hover:text-[#0D9488] hover:border-[#0D9488]/40 transition-all">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
            {/* LinkedIn SVG */}
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-[#FFFDF9] border border-[#E6E0D6] text-[#78716C] hover:text-[#0D9488] hover:border-[#0D9488]/40 transition-all">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
            </a>
            {/* Twitter SVG */}
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-[#FFFDF9] border border-[#E6E0D6] text-[#78716C] hover:text-[#0D9488] hover:border-[#0D9488]/40 transition-all">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
