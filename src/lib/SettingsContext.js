"use client";

import { createContext, useContext, useState, useEffect } from "react";

const SettingsContext = createContext({ tempUnit: "C", setTempUnit: () => {} });

export function SettingsProvider({ children }) {
  const [tempUnit, setTempUnit] = useState("C");

  useEffect(() => {
    const saved = localStorage.getItem("groot-temp-unit");
    if (saved === "F" || saved === "C") setTempUnit(saved);
  }, []);

  const updateTempUnit = (unit) => {
    setTempUnit(unit);
    localStorage.setItem("groot-temp-unit", unit);
  };

  return (
    <SettingsContext.Provider value={{ tempUnit, setTempUnit: updateTempUnit }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
