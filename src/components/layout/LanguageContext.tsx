"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, Language } from "@/locales/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    // Load language preference from localStorage on mount
    const savedLanguage = localStorage.getItem("preferred-language") as Language;
    if (savedLanguage === "en" || savedLanguage === "id") {
      setTimeout(() => {
        setLanguageState(savedLanguage);
      }, 0);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("preferred-language", lang);
  };

  // Helper function to get translation by dot-separated path (e.g. "nav.dashboard")
  const t = (path: string): string => {
    const keys = path.split(".");
    let result: unknown = translations[language];
    
    for (const key of keys) {
      if (result && typeof result === "object" && key in result) {
        result = (result as Record<string, unknown>)[key];
      } else {
        // Fallback to English if not found in active language
        let fallbackResult: unknown = translations["en"];
        for (const fallbackKey of keys) {
          if (fallbackResult && typeof fallbackResult === "object" && fallbackKey in fallbackResult) {
            fallbackResult = (fallbackResult as Record<string, unknown>)[fallbackKey];
          } else {
            return path;
          }
        }
        return typeof fallbackResult === "string" ? fallbackResult : path;
      }
    }
    
    return typeof result === "string" ? result : path;
  };

  // Prevent hydration mismatch: render children only after mount on client
  // or return children with default english if not mounted yet to keep server render
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
