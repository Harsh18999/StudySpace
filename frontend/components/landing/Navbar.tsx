"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Menu, X, LayoutGrid } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) setIsAuth(true);
    }
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Workflow", href: "#workflow" },
    { name: "Pricing", href: "#pricing" },
    { name: "FAQ", href: "#faq" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#FAF7F2]/85 border-b border-[#E6E0D6]/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0D9488] via-[#2563EB] to-[#7C3AED] p-0.5 shadow-sm group-hover:scale-105 transition-transform duration-200">
            <div className="w-full h-full bg-[#FAF7F2] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#0D9488]" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight text-[#1C1917] font-['Plus_Jakarta_Sans']">
              StudySpace<span className="text-[#0D9488]">.AI</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20">
              v2.0
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-[#78716C] hover:text-[#0D9488] transition-colors duration-150"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Right CTA Actions */}
        <div className="hidden md:flex items-center gap-3">
          {isAuth ? (
            <Link
              href="/dashboard"
              className="group relative inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#0D9488] to-[#0F766E] rounded-xl shadow-md hover:shadow-lg hover:from-[#0F766E] hover:to-[#115E59] transition-all duration-200 active:scale-95"
            >
              <LayoutGrid className="w-4 h-4 mr-1.5" />
              <span>Go to Dashboard</span>
            </Link>
          ) : (
            <>
              <Link
                href="/auth"
                className="text-sm font-semibold text-[#1C1917] hover:text-[#0D9488] px-3.5 py-2 rounded-xl transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth"
                className="group relative inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#0D9488] to-[#0F766E] rounded-xl shadow-md hover:shadow-lg hover:from-[#0F766E] hover:to-[#115E59] transition-all duration-200 active:scale-95"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5EFE6] transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FAF7F2] border-b border-[#E6E0D6] px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-[#1C1917] hover:text-[#0D9488] py-2 px-3 rounded-lg hover:bg-[#F5EFE6] transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>
          <div className="pt-3 border-t border-[#E6E0D6] flex flex-col gap-2">
            {isAuth ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center text-sm font-semibold text-white py-2.5 rounded-xl bg-gradient-to-r from-[#0D9488] to-[#0F766E] shadow-sm flex items-center justify-center gap-1.5"
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Go to Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center text-sm font-semibold text-[#1C1917] py-2.5 rounded-xl border border-[#E6E0D6] bg-white hover:bg-[#F5EFE6]"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center text-sm font-semibold text-white py-2.5 rounded-xl bg-gradient-to-r from-[#0D9488] to-[#0F766E] shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
