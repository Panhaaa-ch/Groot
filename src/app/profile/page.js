"use client";

import { useState } from "react";
import { plants, achievements } from "@/lib/mockData";
import {
  Flame,
  Calendar,
  Trophy,
  CheckSquare,
  Droplets,
  Lock,
  Star,
  Sparkles,
  Award,
  BookOpen,
  Plus,
} from "lucide-react";

const iconMap = {
  chat: Sparkles,
  local_fire_department: Flame,
  psychology: Award,
  local_florist: Sparkles,
  water_drop: Droplets,
  yard: BookOpen,
};

export default function ProfilePage() {
  const currentPlant = plants[0];
  const [activeNote, setActiveNote] = useState("");
  const [journalNotes, setJournalNotes] = useState([
    {
      id: "1",
      date: "Aug 19, 2026",
      text: "Monty sprouted a brand new glossy fenestrated leaf today! Light moisture soak given.",
    },
    {
      id: "2",
      date: "Aug 14, 2026",
      text: "Rotated 90 degrees toward morning sun window.",
    },
  ]);

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!activeNote.trim()) return;
    setJournalNotes([
      {
        id: Date.now().toString(),
        date: "Today",
        text: activeNote.trim(),
      },
      ...journalNotes,
    ]);
    setActiveNote("");
  };

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 pb-12 space-y-10">
      {/* Header Profile Section */}
      <section className="flex flex-col items-center justify-center text-center space-y-6 pt-4">
        <div className="relative inline-block">
          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden border-4 border-white soft-shadow relative bg-surface-container-low group">
            <img
              src={currentPlant.avatarUrl}
              alt={`${currentPlant.name} Avatar`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-primary text-on-primary w-12 h-12 rounded-full flex items-center justify-center soft-shadow z-20 border-3 border-surface">
            <Flame className="w-6 h-6 text-secondary-container" />
          </div>
        </div>

        <div>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-on-surface tracking-tight">
            {currentPlant.name}
          </h2>
          <p className="font-display font-semibold text-lg text-primary mt-1.5">
            {currentPlant.nickname}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 bg-surface-container-high px-6 py-2.5 rounded-full shadow-xs border border-surface-dim/50">
          <Star className="w-4 h-4 text-secondary fill-secondary" />
          <span className="font-display font-bold text-base text-on-surface">
            {currentPlant.careStreak} Day Care Streak
          </span>
          <Star className="w-4 h-4 text-secondary fill-secondary" />
        </div>
      </section>

      {/* Lifetime Stats */}
      <section>
        <h3 className="font-display font-bold text-2xl text-on-surface mb-4 px-1">
          Lifetime Stats
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            icon={<Calendar className="w-5 h-5" />}
            iconBg="bg-primary-container/15 text-primary"
            value={currentPlant.plantAgeDays}
            label="Days Old"
          />
          <StatCard
            icon={<Trophy className="w-5 h-5" />}
            iconBg="bg-secondary-container/20 text-secondary"
            value={currentPlant.longestStreak}
            label="Longest Streak"
          />
          <StatCard
            icon={<CheckSquare className="w-5 h-5" />}
            iconBg="bg-tertiary-container/20 text-tertiary"
            value={currentPlant.totalCheckIns}
            label="Check-ins"
          />
          <StatCard
            icon={<Droplets className="w-5 h-5" />}
            iconBg="bg-primary-fixed-dim/60 text-primary"
            value={currentPlant.totalWaterings}
            label="Waterings"
          />
        </div>
      </section>

      {/* Achievements */}
      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="font-display font-bold text-2xl text-on-surface">
            Achievements
          </h3>
          <span className="font-body-sm text-xs font-semibold text-primary bg-primary-container/15 px-3.5 py-1 rounded-full">
            {unlockedCount} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {achievements.map((ach) => {
            const IconComponent = iconMap[ach.iconName] || Sparkles;
            return (
              <div
                key={ach.id}
                className={`rounded-3xl p-6 flex flex-col items-center text-center relative overflow-hidden transition-all duration-300 ${
                  ach.unlocked
                    ? "bg-white soft-shadow border border-surface-dim/40 hover:scale-[1.02]"
                    : "bg-surface-container-low/80 border border-outline-variant/40 opacity-75 grayscale hover:grayscale-0"
                }`}
              >
                {!ach.unlocked && (
                  <div className="absolute top-4 right-4 text-outline">
                    <Lock className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-xs ${
                    ach.unlocked
                      ? ach.category === "chat"
                        ? "bg-primary-container text-on-primary"
                        : "bg-secondary-container text-on-secondary-container"
                      : "bg-surface-variant text-on-surface-variant"
                  }`}
                >
                  <IconComponent className="w-7 h-7" />
                </div>

                <span className="font-display font-bold text-lg text-on-surface">
                  {ach.title}
                </span>
                <span className="font-body-sm text-xs text-on-surface-variant mt-1 text-center">
                  {ach.description}
                </span>

                {ach.unlocked && ach.unlockedDate && (
                  <span className="mt-3 font-body-sm text-[10px] text-primary font-semibold bg-primary-container/10 px-2 py-0.5 rounded-md">
                    Unlocked {ach.unlockedDate}
                  </span>
                )}

                {!ach.unlocked && ach.progress && (
                  <div className="mt-3 w-full">
                    <div className="flex justify-between text-[10px] font-body-sm font-semibold text-on-surface-variant mb-1">
                      <span>Progress</span>
                      <span>
                        {ach.progress.current}/{ach.progress.total}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-surface-container-high">
                      <div
                        className="h-full rounded-full bg-primary-container transition-all"
                        style={{
                          width: `${(ach.progress.current / ach.progress.total) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Care Journal */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 soft-shadow border border-surface-dim/40">
        <div className="flex items-center gap-2.5 mb-6">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="font-display font-bold text-2xl text-on-surface">
            Care Journal & Growth Log
          </h3>
        </div>

        <form onSubmit={handleAddNote} className="flex gap-2 mb-6">
          <input
            type="text"
            value={activeNote}
            onChange={(e) => setActiveNote(e.target.value)}
            placeholder="Add a new observation, growth note, or pruning entry..."
            className="flex-1 bg-surface-container-low border border-surface-dim rounded-2xl px-4 py-3 text-sm text-on-surface focus:outline-hidden focus:border-primary"
          />
          <button
            type="submit"
            disabled={!activeNote.trim()}
            className="px-5 py-3 bg-primary hover:bg-[#495524] disabled:opacity-50 text-on-primary font-semibold text-xs rounded-2xl transition-all squish-press cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Log</span>
          </button>
        </form>

        <div className="space-y-3">
          {journalNotes.map((note) => (
            <div
              key={note.id}
              className="p-4 rounded-2xl bg-surface border border-surface-dim/50 flex items-start justify-between gap-4"
            >
              <div>
                <span className="font-body-sm text-[11px] font-semibold text-primary uppercase tracking-wider block">
                  {note.date}
                </span>
                <p className="font-body-sm text-sm text-on-surface mt-1">
                  {note.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function StatCard({ icon, iconBg, value, label }) {
  return (
    <div className="bg-white rounded-3xl p-6 soft-shadow border border-surface-dim/40 flex flex-col items-start hover:scale-[1.02] transition-transform">
      <div
        className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 ${iconBg}`}
      >
        {icon}
      </div>
      <span className="font-display font-bold text-3xl sm:text-4xl text-on-surface">
        {value}
      </span>
      <span className="font-body-sm text-xs font-semibold text-on-surface-variant mt-1">
        {label}
      </span>
    </div>
  );
}
