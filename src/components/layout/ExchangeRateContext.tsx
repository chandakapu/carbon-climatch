"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface ExchangeRateContextType {
  usdToIdr: number;
  isLoading: boolean;
}

const DEFAULT_USD_TO_IDR = 17796;
const ExchangeRateContext = createContext<ExchangeRateContextType>({
  usdToIdr: DEFAULT_USD_TO_IDR,
  isLoading: false,
});

export function ExchangeRateProvider({ children }: { children: React.ReactNode }) {
  const [usdToIdr, setUsdToIdr] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const cachedRate = sessionStorage.getItem("usd_to_idr_rate");
      const cachedTime = sessionStorage.getItem("usd_to_idr_time");
      const isCacheValid = cachedRate && cachedTime && (Date.now() - Number(cachedTime) < 3600000);
      if (isCacheValid) return Number(cachedRate);
    }
    return DEFAULT_USD_TO_IDR;
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const cachedRate = sessionStorage.getItem("usd_to_idr_rate");
      const cachedTime = sessionStorage.getItem("usd_to_idr_time");
      const isCacheValid = cachedRate && cachedTime && (Date.now() - Number(cachedTime) < 3600000);
      if (isCacheValid) return false;
    }
    return true;
  });

  useEffect(() => {
    if (!isLoading) return;

    let active = true;

    async function fetchRate() {
      try {
        const response = await fetch("https://open.er-api.com/v6/latest/USD");
        if (!response.ok) throw new Error("Failed to fetch exchange rate");
        const data = await response.json();
        const rate = data?.rates?.IDR;
        
        if (rate && typeof rate === "number" && active) {
          setUsdToIdr(rate);
          sessionStorage.setItem("usd_to_idr_rate", rate.toString());
          sessionStorage.setItem("usd_to_idr_time", Date.now().toString());
        }
      } catch (error) {
        console.warn("Could not fetch live exchange rate, falling back to default:", error);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    fetchRate();

    return () => {
      active = false;
    };
  }, [isLoading]);

  return (
    <ExchangeRateContext.Provider value={{ usdToIdr, isLoading }}>
      {children}
    </ExchangeRateContext.Provider>
  );
}

export function useExchangeRate() {
  return useContext(ExchangeRateContext);
}
