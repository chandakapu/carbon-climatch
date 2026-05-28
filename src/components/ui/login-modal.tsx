"use client";

import React, { useState, useEffect } from "react";
import { Eye, EyeOff, X, Sparkles } from "lucide-react";
import { useLanguage } from "@/components/layout/LanguageContext";
import { useRouter } from "next/navigation";

// --- GOOGLE ICON ---
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
  </svg>
);

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-700/50 bg-[#2a2a2a] transition-all duration-200 focus-within:border-[#0CF2A0]/70 focus-within:bg-[#0CF2A0]/5">
    {children}
  </div>
);

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("cfo@indosteel.co.id");
  const [password, setPassword] = useState("••••••••");
  const [modalFeedback, setModalFeedback] = useState<{ type: "success" | "error" | ""; message: string }>({ type: "", message: "" });

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle ESC key close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSignIn = () => {
    if (!email || !password) {
      setModalFeedback({ type: "error", message: t("landing.alertEnterCredentials") });
      return;
    }
    // Set mock authentication flag and user email
    sessionStorage.setItem("logged_in", "true");
    sessionStorage.setItem("user_email", email);
    onClose();
    // Dispatch a custom event to notify Navbar and other components of auth change
    window.dispatchEvent(new Event("auth_change"));
    router.push("/dashboard");
  };

  const handleDemoSignIn = () => {
    sessionStorage.setItem("logged_in", "true");
    sessionStorage.setItem("user_email", "cfo@indosteel.co.id");
    onClose();
    window.dispatchEvent(new Event("auth_change"));
    router.push("/dashboard");
  };

  const handleResetPassword = () => {
    setModalFeedback({ type: "success", message: t("landing.alertResetSent") });
  };

  const handleCreateAccount = () => {
    setModalFeedback({ type: "error", message: t("landing.alertAccountDisabled") });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm">
      {/* Backdrop area click-to-close */}
      <div 
        className="absolute inset-0 z-0" 
        onClick={onClose} 
      />

      {/* Modal Container with my-auto for centered positioning and no top overlap */}
      <div className="relative z-10 w-full max-w-md my-auto overflow-hidden rounded-3xl border border-white/5 bg-[#1a1a1a] p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button 
          type="button" 
          onClick={onClose} 
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col items-center text-center gap-2 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0CF2A0]/10 border border-[#0CF2A0]/20 text-[#0CF2A0] mb-2">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Carbon <span className="text-[#0CF2A0]">Climatch</span>
          </h2>
          <p className="text-sm text-slate-400">
            {t("landing.description")}
          </p>
        </div>
        {modalFeedback.message && (
          <div className={`mb-6 p-3.5 rounded-2xl text-xs font-semibold text-center border ${
            modalFeedback.type === "error" 
              ? "bg-red-500/10 border-red-500/20 text-red-400" 
              : "bg-[#0CF2A0]/10 border-[#0CF2A0]/20 text-[#0CF2A0]"
          }`}>
            {modalFeedback.message}
          </div>
        )}

        {/* Form Inputs */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              {t("landing.emailLabel")}
            </label>
            <GlassInputWrapper>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("landing.emailPlaceholder")}
                className="w-full bg-transparent text-sm p-3.5 rounded-2xl text-white focus:outline-none focus:ring-1 focus:ring-[#0CF2A0]/50"
              />
            </GlassInputWrapper>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              {t("landing.passwordLabel")}
            </label>
            <GlassInputWrapper>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("landing.passwordPlaceholder")}
                  className="w-full bg-transparent text-sm p-3.5 pr-12 rounded-2xl text-white focus:outline-none focus:ring-1 focus:ring-[#0CF2A0]/50"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </GlassInputWrapper>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                name="rememberMe" 
                className="h-3.5 w-3.5 rounded border-slate-700 bg-white/5 accent-[#0CF2A0] text-[#0CF2A0] focus:ring-0 focus:ring-offset-0" 
              />
              <span className="text-slate-300">{t("landing.keepSignedIn")}</span>
            </label>
            <button 
              type="button"
              onClick={handleResetPassword} 
              className="hover:underline text-[#0CF2A0] font-semibold cursor-pointer"
            >
              {t("landing.resetPassword")}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={handleSignIn}
              className="w-full rounded-xl bg-[#0CF2A0] py-3.5 text-sm font-semibold text-[#111111] hover:bg-opacity-90 transition-all cursor-pointer text-center"
            >
              {t("landing.signInBtn")}
            </button>

            {/* Quick Demo Login */}
            <button
              type="button"
              onClick={handleDemoSignIn}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0CF2A0]/10 border border-[#0CF2A0]/30 py-3.5 text-sm font-bold text-[#0CF2A0] hover:bg-[#0CF2A0]/20 transition-all cursor-pointer text-center"
            >
              <Sparkles className="h-4 w-4 text-[#0CF2A0] animate-pulse" />
              Quick Demo Login
            </button>
          </div>

          {/* Social Sign In Divider */}
          <div className="relative flex items-center justify-center py-1">
            <span className="w-full border-t border-slate-800"></span>
            <span className="px-3 text-xs text-slate-500 bg-[#1a1a1a] absolute">
              {t("landing.orContinueWith")}
            </span>
          </div>

          {/* Google Sign In */}
          <button 
            type="button"
            onClick={handleDemoSignIn} 
            className="w-full flex items-center justify-center gap-2 border border-slate-800 rounded-xl py-3 bg-white/5 text-slate-300 hover:bg-white/10 text-sm transition-colors cursor-pointer"
          >
            <GoogleIcon />
            {t("landing.continueWithGoogle")}
          </button>

          {/* Create Account Link */}
          <p className="text-center text-xs text-slate-400 pt-2">
            {t("landing.newToPlatform")}{" "}
            <button 
              type="button"
              onClick={handleCreateAccount} 
              className="text-[#0CF2A0] hover:underline font-semibold cursor-pointer"
            >
              {t("landing.createAccount")}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
