"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/components/layout/LanguageContext";
import { useState, useEffect } from "react";
import { LoginModal } from "@/components/ui/login-modal";
import { Menu, X, LogOut, Shield } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync auth state on mount and on custom events
  useEffect(() => {
    const checkAuth = () => {
      setIsLoggedIn(sessionStorage.getItem("logged_in") === "true");
    };

    checkAuth();
    window.addEventListener("auth_change", checkAuth);
    return () => {
      window.removeEventListener("auth_change", checkAuth);
    };
  }, []);

  const handleSignOut = () => {
    sessionStorage.removeItem("logged_in");
    sessionStorage.removeItem("user_email");
    setIsLoggedIn(false);
    setIsMobileMenuOpen(false);
    window.dispatchEvent(new Event("auth_change"));
    router.push("/");
  };

  const triggerSignIn = () => {
    setIsMobileMenuOpen(false);
    setIsLoginModalOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#111111]/90 backdrop-blur-xl">
      <nav aria-label="Primary Navigation" className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href={isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0CF2A0]/15 border border-[#0CF2A0]/30">
            <svg className="h-5 w-5 text-[#0CF2A0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
            </svg>
          </div>
          <div>
            <span className="font-bold tracking-tight text-white text-lg leading-none">carbon</span>
            <span className="font-bold tracking-tight text-[#0CF2A0] text-lg leading-none">climatch</span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          {isLoggedIn ? (
            <>
              <Link
                href="/dashboard"
                className={`transition-colors ${
                  pathname === "/dashboard" ? "text-[#0CF2A0] font-semibold" : "text-slate-400 hover:text-white"
                }`}
              >
                {t("nav.dashboard")}
              </Link>
              <Link
                href="/calculator"
                className={`transition-colors ${
                  pathname === "/calculator" ? "text-[#0CF2A0] font-semibold" : "text-slate-400 hover:text-white"
                }`}
              >
                {t("nav.calculator")}
              </Link>
              <Link
                href="/strategy"
                className={`transition-colors ${
                  pathname === "/strategy" ? "text-[#0CF2A0] font-semibold" : "text-slate-400 hover:text-white"
                }`}
              >
                {t("nav.strategy")}
              </Link>
              <Link
                href="/timeline"
                className={`transition-colors ${
                  pathname === "/timeline" ? "text-[#0CF2A0] font-semibold" : "text-slate-400 hover:text-white"
                }`}
              >
                {t("nav.timeline")}
              </Link>
            </>
          ) : (
            <>
              <Link href="/#features" className="text-slate-400 hover:text-white transition-colors">
                {language === "id" ? "Fitur" : "Features"}
              </Link>
              <Link href="/#pricing" className="text-slate-400 hover:text-white transition-colors">
                {language === "id" ? "Harga" : "Pricing"}
              </Link>
              <Link href="/#testimonials" className="text-slate-400 hover:text-white transition-colors">
                Testimonials
              </Link>
            </>
          )}
        </div>

        {/* Desktop Controls (Language, CTA, Sign In/Out) */}
        <div className="hidden md:flex items-center gap-4">
          {/* Language Switcher */}
          <div className="flex items-center gap-1 rounded-lg bg-slate-950 border border-white/5 p-0.5">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                language === "en" ? "bg-[#0CF2A0] text-[#111111] shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage("id")}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                language === "id" ? "bg-[#0CF2A0] text-[#111111] shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              ID
            </button>
          </div>

          {isLoggedIn ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-lg border border-white/10 hover:border-red-500/30 bg-white/5 hover:bg-red-500/10 transition-all duration-200 px-4 py-2 text-sm font-semibold text-slate-300 hover:text-red-400 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              {language === "id" ? "Keluar" : "Sign Out"}
            </button>
          ) : (
            <button
              type="button"
              onClick={triggerSignIn}
              className="flex items-center gap-2 rounded-lg bg-[#0CF2A0] hover:bg-opacity-90 transition-colors px-4 py-2 text-sm font-semibold text-[#111111] cursor-pointer"
            >
              <Shield className="h-4 w-4" />
              {language === "id" ? "Masuk" : "Sign In"}
            </button>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center md:hidden gap-3">
          {/* Mobile Language Switcher */}
          <div className="flex items-center gap-1 rounded-lg bg-slate-950 border border-white/5 p-0.5">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-md transition-all cursor-pointer ${
                language === "en" ? "bg-[#0CF2A0] text-[#111111]" : "text-slate-400"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage("id")}
              className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-md transition-all cursor-pointer ${
                language === "id" ? "bg-[#0CF2A0] text-[#111111]" : "text-slate-400"
              }`}
            >
              ID
            </button>
          </div>
          
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-[#111111] px-6 py-4 space-y-4 animate-in slide-in-from-top duration-200">
          <div className="flex flex-col gap-3">
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-sm py-1.5 ${pathname === "/dashboard" ? "text-[#0CF2A0]" : "text-slate-300"}`}
                >
                  {t("nav.dashboard")}
                </Link>
                <Link
                  href="/calculator"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-sm py-1.5 ${pathname === "/calculator" ? "text-[#0CF2A0]" : "text-slate-300"}`}
                >
                  {t("nav.calculator")}
                </Link>
                <Link
                  href="/strategy"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-sm py-1.5 ${pathname === "/strategy" ? "text-[#0CF2A0]" : "text-slate-300"}`}
                >
                  {t("nav.strategy")}
                </Link>
                <Link
                  href="/timeline"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-sm py-1.5 ${pathname === "/timeline" ? "text-[#0CF2A0]" : "text-slate-300"}`}
                >
                  {t("nav.timeline")}
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 py-2.5 text-sm font-semibold text-red-400 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  {language === "id" ? "Keluar" : "Sign Out"}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/#features"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-sm py-1.5 text-slate-300"
                >
                  {language === "id" ? "Fitur" : "Features"}
                </Link>
                <Link
                  href="/#pricing"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-sm py-1.5 text-slate-300"
                >
                  {language === "id" ? "Harga" : "Pricing"}
                </Link>
                <Link
                  href="/#testimonials"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-sm py-1.5 text-slate-300"
                >
                  Testimonials
                </Link>
                <button
                  type="button"
                  onClick={triggerSignIn}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0CF2A0] py-2.5 text-sm font-semibold text-[#111111] cursor-pointer"
                >
                  <Shield className="h-4 w-4" />
                  {language === "id" ? "Masuk" : "Sign In"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      </header>

      {/* Login Modal Overlay */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  );
}

