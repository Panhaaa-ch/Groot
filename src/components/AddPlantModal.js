"use client";

import { useState } from "react";
import { X, Sprout, Plus } from "lucide-react";

const plantPresets = [
  {
    label: "Monstera",
    species: "Monstera deliciosa",
    photo:
      "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "Ficus / Bonsai",
    species: "Ficus microcarpa",
    photo:
      "https://images.unsplash.com/photo-1512428813834-c702c7702b78?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "Snake Plant",
    species: "Sansevieria trifasciata",
    photo:
      "https://images.unsplash.com/photo-1593482892290-f54927ae1bf6?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "Pothos",
    species: "Epipremnum aureum",
    photo:
      "https://images.unsplash.com/photo-1572688484438-313a6e50c333?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "Calathea",
    species: "Calathea orbifolia",
    photo:
      "https://images.unsplash.com/photo-1598880940371-c756e015fea1?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "Succulent",
    species: "Echeveria elegans",
    photo:
      "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=800&q=80",
  },
];

export default function AddPlantModal({ isOpen, onClose }) {
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("Monstera deliciosa");
  const [location, setLocation] = useState("Living Room");
  const [selectedPhoto, setSelectedPhoto] = useState(plantPresets[0].photo);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setName("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-surface-dim/50">
        <div className="flex items-center justify-between pb-4 border-b border-surface-dim/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary-container/15 text-primary">
              <Sprout className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-2xl text-on-surface">
              Add New Plant
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container-high text-outline cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <label className="font-body-sm text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1.5">
              Plant Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fernie, Penny, Bamboo"
              className="w-full bg-surface-container-low border border-surface-dim rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-hidden focus:border-primary"
            />
          </div>

          <div>
            <label className="font-body-sm text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1.5">
              Species / Botanical Type
            </label>
            <select
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              className="w-full bg-surface-container-low border border-surface-dim rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-hidden focus:border-primary"
            >
              {plantPresets.map((p) => (
                <option key={p.species} value={p.species}>
                  {p.label} ({p.species})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-body-sm text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-2">
              Select Botanical Photo
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {plantPresets.map((preset) => {
                const isSelected = selectedPhoto === preset.photo;
                return (
                  <div
                    key={preset.label}
                    onClick={() => {
                      setSelectedPhoto(preset.photo);
                      setSpecies(preset.species);
                    }}
                    className={`h-20 rounded-xl overflow-hidden relative cursor-pointer border-2 transition-all group ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={preset.photo}
                      alt={preset.label}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/25 flex items-end p-1">
                      <span className="text-[10px] text-white font-medium truncate">
                        {preset.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="font-body-sm text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1.5">
              Location in Home
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Living Room Window, Desk, Balcony"
              className="w-full bg-surface-container-low border border-surface-dim rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-hidden focus:border-primary"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-full font-body-sm text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-6 py-3 bg-primary hover:bg-[#495524] disabled:opacity-50 text-on-primary rounded-full font-body-sm text-xs font-semibold shadow-xs transition-all squish-press cursor-pointer"
            >
              Add to Greenhouse
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
