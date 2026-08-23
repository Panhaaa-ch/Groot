"use client";

import { X, Sliders, RefreshCw } from "lucide-react";
import { plants } from "@/lib/mockData";
import { useSettings } from "@/lib/SettingsContext";

export default function SettingsModal({ isOpen, onClose }) {
  const currentPlant = plants[0];
  const { tempUnit, setTempUnit } = useSettings();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-surface-dim/50">
        <div className="flex items-center justify-between pb-4 border-b border-surface-dim/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary-container/15 text-primary">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-2xl text-on-surface">
              Settings & Lab
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container-high text-outline cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 mt-6">
          <div>
            <label className="font-body-sm text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-2">
              Temperature Unit
            </label>
            <div className="grid grid-cols-2 gap-2 bg-surface-container-low p-1.5 rounded-2xl">
              <button
                onClick={() => setTempUnit("F")}
                className={`py-2 rounded-xl font-body-sm text-xs font-semibold transition-all cursor-pointer ${tempUnit === "F" ? "bg-white text-primary shadow-xs" : "text-on-surface-variant"}`}
              >
                Fahrenheit (&deg;F)
              </button>
              <button
                onClick={() => setTempUnit("C")}
                className={`py-2 rounded-xl font-body-sm text-xs font-semibold transition-all cursor-pointer ${tempUnit === "C" ? "bg-white text-primary shadow-xs" : "text-on-surface-variant"}`}
              >
                Celsius (&deg;C)
              </button>
            </div>
          </div>

          <div className="bg-surface p-4 rounded-2xl border border-surface-dim/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-body-sm text-xs font-semibold text-on-surface">
                Simulate {currentPlant.name} Soil Moisture
              </span>
              <span className="font-display font-bold text-sm text-primary">
                {currentPlant.soilMoisture}%
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              defaultValue={currentPlant.soilMoisture}
              className="w-full accent-primary cursor-pointer"
            />
            <p className="font-body-sm text-[11px] text-outline">
              Drag slider to test different hydration moods (Dry &lt;20%, Thirsty
              20-40%, Optimal &gt;40%).
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-2xl bg-surface-container-low hover:bg-surface-container-high text-secondary font-body-sm text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset Greenhouse Demo State</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
