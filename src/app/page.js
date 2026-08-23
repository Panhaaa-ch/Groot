"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { ref, onValue, set } from "firebase/database";
import { db } from "@/lib/firebase";
import { plants } from "@/lib/mockData";
import {
  Droplets,
  Thermometer,
  Wind,
  Calendar,
  MessageCircle,
  Plus,
  Flame,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";

import { useFirebaseValue } from "@/hooks/useFirebaseValue";
import { useSettings } from "@/lib/SettingsContext";

export default function Dashboard() {
  const { tempUnit } = useSettings();
  const [selectedPlantId, setSelectedPlantId] = useState(plants[0].id);
  const [wateringAnim, setWateringAnim] = useState(false);
  const [mistingAnim, setMistingAnim] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [timeframe, setTimeframe] = useState("1d");
  const [historyData, setHistoryData] = useState([]);
  const [showScoreHelp, setShowScoreHelp] = useState(false);
  const [showAgeHelp, setShowAgeHelp] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState("moisture");

  useEffect(() => {
    if (!db) return;
    const historyRef = ref(db, "history");
    const unsubscribe = onValue(
      historyRef,
      (snapshot) => {
        const raw = snapshot.val();
        if (!raw) { setHistoryData([]); return; }
        const entries = Object.values(raw)
          .filter((e) => e && e.timestamp)
          .map((e) => ({
            timestamp: new Date(e.timestamp),
            moisture: e.moisture ?? 0,
            humidity: e.humidity ?? 0,
            temperature: e.temperature ?? e.temp ?? 0,
          }))
          .sort((a, b) => a.timestamp - b.timestamp);
        setHistoryData(entries);
      },
      () => setHistoryData([])
    );
    return unsubscribe;
  }, []);

  const currentPlant =
    plants.find((p) => p.id === selectedPlantId) || plants[0];

  const fbMoisture = useFirebaseValue("current/moisture", null);
  const fbTemperature = useFirebaseValue("current/temperature", null);
  const fbHumidity = useFirebaseValue("current/humidity", null);

  const isLivePlant = currentPlant.id === "monty-monstera";

  const mockHistoryData = useMemo(
    () => isLivePlant ? [] : generateMockHistory(currentPlant.id),
    [currentPlant.id, isLivePlant]
  );

  const moisture = isLivePlant && fbMoisture !== null ? fbMoisture : currentPlant.soilMoisture;
  const rawTempF = isLivePlant && fbTemperature !== null
    ? (fbTemperature * 9 / 5) + 32
    : currentPlant.temperature;
  const humidity = isLivePlant && fbHumidity !== null ? fbHumidity : currentPlant.humidity;

  const tempC = isLivePlant && fbTemperature !== null
    ? fbTemperature
    : (rawTempF - 32) * 5 / 9;

  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const recentHistory = historyData.filter((e) => e.timestamp.getTime() >= oneHourAgo);

  const avgMoisture = recentHistory.length > 0
    ? recentHistory.reduce((s, e) => s + e.moisture, 0) / recentHistory.length
    : moisture;
  const avgTempC = recentHistory.length > 0
    ? recentHistory.reduce((s, e) => s + e.temperature, 0) / recentHistory.length
    : tempC;
  const avgHumidity = recentHistory.length > 0
    ? recentHistory.reduce((s, e) => s + e.humidity, 0) / recentHistory.length
    : humidity;

  const scoreMoisture = isLivePlant ? avgMoisture : moisture;
  const scoreTempC = isLivePlant ? avgTempC : tempC;
  const scoreHumidity = isLivePlant ? avgHumidity : humidity;

  const soilScore = scoreMoisture >= 35 && scoreMoisture <= 70
    ? 100
    : scoreMoisture < 35
      ? Math.max(0, (scoreMoisture / 35) * 100)
      : Math.max(0, ((100 - scoreMoisture) / 30) * 100);
  const tempScore = scoreTempC >= 18 && scoreTempC <= 26
    ? 100
    : scoreTempC < 18
      ? Math.max(0, 100 - (18 - scoreTempC) * 12)
      : Math.max(0, 100 - (scoreTempC - 26) * 12);
  const humidScore = scoreHumidity >= 40 && scoreHumidity <= 60
    ? 100
    : scoreHumidity < 40
      ? Math.max(0, (scoreHumidity / 40) * 100)
      : Math.max(0, ((100 - scoreHumidity) / 40) * 100);

  const grootScore = isLivePlant
    ? Math.round(soilScore * 0.4 + tempScore * 0.2 + humidScore * 0.2 + 20)
    : currentPlant.vitality;

  const prevScoreRef = useRef(null);
  useEffect(() => {
    if (!db || !isLivePlant || prevScoreRef.current === grootScore) return;
    prevScoreRef.current = grootScore;
    set(ref(db, "current/grootScore"), grootScore).catch(() => {});
  }, [grootScore, isLivePlant]);

  const scoreState = grootScore >= 75 ? "thriving" : grootScore > 40 ? "steady" : "critical";

  const isThirsty = moisture < 40;
  const isCritical = scoreState === "critical";

  const displayTemp = tempUnit === "F"
    ? `${Math.round(rawTempF)}°F`
    : `${Math.round(((rawTempF - 32) * 5) / 9)}°C`;
  const isTempIdeal = rawTempF >= 65 && rawTempF <= 78;

  const tempPercent = Math.min(
    97,
    Math.max(3, ((rawTempF - 50) / 40) * 100)
  );
  const moisturePercent = Math.min(97, Math.max(3, moisture));
  const humidityPercent = Math.min(97, Math.max(3, humidity));
  const vitalityPercent = Math.min(97, Math.max(3, grootScore));

  const scoreStatusText = scoreState === "thriving"
    ? "Looking vibrant and healthy!"
    : scoreState === "steady"
      ? "Hanging in there, could use some care."
      : "Needs urgent attention right now.";

  const handleWater = () => {
    setWateringAnim(true);
    setTimeout(() => setWateringAnim(false), 1200);
  };

  const handleMist = () => {
    setMistingAnim(true);
    setTimeout(() => setMistingAnim(false), 1200);
  };

  const sweetSpotGradient =
    "linear-gradient(to right, #ba1a1a 0%, #ffa278 22%, #8a9a5b 42%, #56642b 50%, #8a9a5b 58%, #ffa278 78%, #ba1a1a 100%)";

  return (
    <>
      <div className="blob-bg w-[40vw] h-[40vw] top-[-10vw] left-[-10vw] rounded-full" />
      <div
        className="blob-bg w-[30vw] h-[30vw] bottom-[-5vw] right-[-5vw] rounded-full"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,162,120,0.05) 0%, rgba(255,162,120,0.1) 100%)",
        }}
      />

      <main className="flex-1 w-full max-w-[1200px] mx-auto z-10 px-4 sm:px-8 pb-12 space-y-6 md:space-y-8">
        {/* Title & Plant Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="font-display font-bold text-3xl md:text-4xl text-on-surface tracking-tight">
            Your Plants
          </h2>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {plants.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPlantId(p.id)}
                className={`px-4 py-2 rounded-full font-body-sm text-xs font-semibold uppercase tracking-wider transition-all squish-press cursor-pointer whitespace-nowrap ${p.id === currentPlant.id
                  ? "bg-surface-container-high text-on-surface shadow-xs border border-surface-dim"
                  : "bg-surface-container/60 text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  }`}
              >
                {p.name} ({p.species.split(" ")[0]})
              </button>
            ))}
            <button
              title="Add a new plant"
              className="p-2 rounded-full bg-surface-container/60 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors squish-press cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero + Vitality + Streak */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Hero Card */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-5 sm:p-6 card-shadow border border-surface-dim/40 flex flex-col md:flex-row gap-6 relative overflow-hidden">
            {wateringAnim && (
              <div className="absolute inset-0 bg-primary/15 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center">
                <div className="p-4 rounded-full bg-primary text-on-primary shadow-xl animate-bounce">
                  <Droplets className="w-8 h-8" />
                </div>
                <p className="font-display font-bold text-lg text-primary mt-2 bg-white/90 px-4 py-1 rounded-full shadow-xs">
                  Refreshed & Watered!
                </p>
              </div>
            )}
            {mistingAnim && (
              <div className="absolute inset-0 bg-primary/10 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center">
                <div className="p-4 rounded-full bg-surface-container-high text-primary shadow-xl animate-bounce">
                  <Wind className="w-8 h-8" />
                </div>
                <p className="font-display font-bold text-lg text-primary mt-2 bg-white/90 px-4 py-1 rounded-full shadow-xs">
                  Misted & Fresh!
                </p>
              </div>
            )}

            <div className="w-full md:w-5/12 h-64 md:h-auto min-h-[220px] rounded-2xl overflow-hidden relative shadow-inner bg-surface-container-low flex-shrink-0 group">
              <img
                src={currentPlant.heroImageUrl}
                alt={currentPlant.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-body-sm font-semibold text-on-surface shadow-xs flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${isCritical
                    ? "bg-error animate-ping"
                    : isThirsty
                      ? "bg-secondary-container"
                      : "bg-primary"
                    }`}
                />
                <span>{currentPlant.location}</span>
              </div>
            </div>

            <div className="w-full md:w-7/12 flex flex-col justify-between py-1">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-secondary-container/20 text-on-secondary-container font-body-sm text-xs font-semibold tracking-wide">
                  {isCritical ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  ) : (
                    <Droplets className="w-3.5 h-3.5" />
                  )}
                  <span>{currentPlant.statusLabel.toUpperCase()}</span>
                </div>

                <h3 className="font-display font-bold text-2xl sm:text-3xl text-on-surface leading-tight">
                  {currentPlant.thoughtHeadline}
                </h3>

                <p className="font-body-md text-[15px] text-on-surface-variant leading-relaxed">
                  {currentPlant.thoughtDescription}
                </p>
              </div>

              <div className="pt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/chat"
                  className={`flex items-center gap-2 px-6 py-3 rounded-full text-white font-body-md font-semibold text-sm shadow-sm hover:shadow-md transition-all squish-press cursor-pointer ${isCritical
                    ? "bg-primary hover:bg-[#495524]"
                    : "bg-secondary hover:bg-[#7e3f22]"
                    }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Talk to {currentPlant.name}</span>
                </Link>

                <button
                  onClick={handleWater}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-full bg-surface-container-high hover:bg-surface-dim text-on-surface font-body-sm font-semibold text-xs transition-colors squish-press cursor-pointer"
                >
                  <Droplets className="w-4 h-4 text-primary" />
                  <span>Water</span>
                </button>

                <button
                  onClick={handleMist}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-full bg-surface-container-high hover:bg-surface-dim text-on-surface font-body-sm font-semibold text-xs transition-colors squish-press cursor-pointer"
                >
                  <Wind className="w-4 h-4 text-primary" />
                  <span>Mist</span>
                </button>
              </div>
            </div>
          </div>

          {/* Vitality + Streak Column */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Groot Score */}
            <div
              className="rounded-3xl p-6 flex-1 flex flex-col justify-between card-shadow transition-all relative overflow-hidden bg-white border border-surface-dim/40"
            >
              <div
                className="absolute inset-0 opacity-[0.07] pointer-events-none rounded-3xl"
                style={{
                  background: scoreState === "thriving"
                    ? "linear-gradient(135deg, #56642b 0%, #bdce89 100%)"
                    : scoreState === "steady"
                      ? "linear-gradient(135deg, #b5651d 0%, #ffa278 100%)"
                      : "linear-gradient(135deg, #ba1a1a 0%, #ff6b6b 100%)",
                }}
              />

              <div className="relative z-20">
                <div className="flex items-center justify-between">
                  <span className="font-body-sm text-xs font-semibold tracking-wider uppercase text-on-surface-variant flex items-center gap-1.5">
                    GROOT SCORE
                    <button onClick={() => setShowScoreHelp(!showScoreHelp)} className="cursor-help">
                      <HelpCircle className={`w-3.5 h-3.5 transition-colors ${showScoreHelp ? "text-primary" : "text-outline/50 hover:text-primary"}`} />
                    </button>
                  </span>
                  {showScoreHelp && (
                    <div className="absolute top-8 left-0 right-0 z-50 bg-inverse-surface text-inverse-on-surface text-xs font-body-sm p-3 rounded-xl shadow-lg leading-relaxed">
                      An overall health score (0-100) combining soil moisture (40%), temperature (20%), humidity (20%), and base vitality (20%). Helps you quickly see if your plant needs attention.
                    </div>
                  )}
                  <span
                    className="px-2.5 py-0.5 rounded-full font-body-sm text-[11px] font-semibold"
                    style={{
                      backgroundColor: scoreState === "thriving"
                        ? "rgba(86, 100, 43, 0.12)"
                        : scoreState === "steady"
                          ? "rgba(181, 101, 29, 0.12)"
                          : "rgba(186, 26, 26, 0.12)",
                      color: scoreState === "thriving"
                        ? "#56642b"
                        : scoreState === "steady"
                          ? "#b5651d"
                          : "#ba1a1a",
                    }}
                  >
                    {scoreState === "thriving" ? "Thriving" : scoreState === "steady" ? "Steady" : "Critical"}
                  </span>
                </div>

                <div className="mt-3 flex items-baseline gap-1">
                  <span
                    className="font-display font-bold text-5xl sm:text-6xl tracking-tight"
                    style={{
                      color: scoreState === "thriving"
                        ? "#56642b"
                        : scoreState === "steady"
                          ? "#b5651d"
                          : "#ba1a1a",
                    }}
                  >
                    {grootScore}
                  </span>
                  <span className="font-display font-semibold text-2xl text-on-surface-variant/70">
                    /100
                  </span>
                </div>
              </div>

              <div className="my-4 space-y-1.5 relative z-10">
                <div className="relative h-3 w-full rounded-full overflow-hidden bg-surface-container-high">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${grootScore}%`,
                      background: scoreState === "thriving"
                        ? "linear-gradient(to right, #bdce89, #56642b)"
                        : scoreState === "steady"
                          ? "linear-gradient(to right, #ffd59a, #b5651d)"
                          : "linear-gradient(to right, #ff9a9a, #ba1a1a)",
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-body-sm font-semibold px-0.5 text-on-surface-variant/60">
                  <span className={scoreState === "critical" ? "text-error font-bold" : ""}>Critical</span>
                  <span className={scoreState === "steady" ? "font-bold" : ""} style={scoreState === "steady" ? { color: "#b5651d" } : {}}>Steady</span>
                  <span className={scoreState === "thriving" ? "font-bold" : ""} style={scoreState === "thriving" ? { color: "#56642b" } : {}}>Thriving</span>
                </div>
              </div>

              <p
                className="font-body-sm text-sm leading-snug font-medium text-on-surface-variant relative z-10"
              >
                {scoreStatusText}
              </p>
            </div>

            {/* Care Streak */}
            <div className="bg-white rounded-3xl p-6 card-shadow border border-surface-dim/40 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center flex-shrink-0">
                <Flame className="w-7 h-7 text-secondary" />
              </div>
              <div>
                <span className="font-body-sm text-xs font-semibold text-on-surface-variant tracking-wider uppercase block">
                  CARE STREAK
                </span>
                <span className="font-display font-bold text-2xl text-on-surface mt-0.5 block">
                  {currentPlant.careStreak} Days
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Sensor Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <SensorGauge
            icon={<Droplets className="w-4 h-4 text-primary" />}
            label="SOIL MOISTURE"
            value={`${moisture}%`}
            percent={moisturePercent}
            gradient={sweetSpotGradient}
            labels={["Dry", "Optimal", "Wet"]}
            lowThreshold={30}
            highThreshold={70}
            currentValue={moisture}
            helpText="Measures how much water is in the soil. Most houseplants thrive between 30-70%. Too dry and roots can't absorb nutrients; too wet risks root rot."
          />
          <SensorGauge
            icon={<Thermometer className="w-4 h-4 text-secondary" />}
            label="ROOM TEMP"
            value={displayTemp}
            subtitle={
              isTempIdeal
                ? "Ideal range"
                : currentPlant.temperature < 65
                  ? "Chilly"
                  : "Warm"
            }
            subtitleColor={isTempIdeal ? "text-primary" : "text-secondary"}
            percent={tempPercent}
            gradient={sweetSpotGradient}
            labels={["Cold", "Ideal", "Hot"]}
            lowThreshold={65}
            highThreshold={78}
            currentValue={rawTempF}
            helpText="Room temperature affects plant metabolism. Most tropical houseplants prefer 18-26°C (65-78°F). Cold drafts can shock roots and slow growth."
          />
          <SensorGauge
            icon={<Wind className="w-4 h-4 text-primary" />}
            label="HUMIDITY"
            value={`${humidity}%`}
            percent={humidityPercent}
            gradient={sweetSpotGradient}
            labels={["Dry", "Ideal", "Humid"]}
            lowThreshold={35}
            highThreshold={68}
            currentValue={humidity}
            helpText="Air humidity impacts how fast leaves lose water. Tropical plants love 40-60%. Low humidity causes brown leaf tips; too high can invite fungal issues."
          />
          <div className="bg-white rounded-2xl p-5 card-shadow border border-surface-dim/40 flex flex-col justify-between relative">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="font-body-sm text-xs font-semibold uppercase tracking-wider flex-1">
                PLANT AGE
              </span>
              <button onClick={() => setShowAgeHelp(!showAgeHelp)} className="cursor-help">
                <HelpCircle className={`w-3.5 h-3.5 transition-colors ${showAgeHelp ? "text-primary" : "text-outline/50 hover:text-primary"}`} />
              </button>
            </div>
            {showAgeHelp && (
              <div className="absolute top-full left-0 right-0 mt-1 z-40 bg-inverse-surface text-inverse-on-surface text-xs font-body-sm p-3 rounded-xl shadow-lg leading-relaxed">
                Tracks how long you've been caring for this plant. Longer care builds familiarity with its seasonal needs and growth patterns.
              </div>
            )}
            <div className="my-3">
              <span className="font-display font-bold text-3xl text-on-surface">
                {currentPlant.plantAgeDays} days
              </span>
            </div>
            <div className="text-[12px] font-body-sm text-outline">
              Since adoption
            </div>
          </div>
        </div>

        {/* Metric Trend Chart */}
        <MetricChart
          historyData={isLivePlant ? historyData : mockHistoryData}
          timeframe={timeframe}
          setTimeframe={setTimeframe}
          hoveredPoint={hoveredPoint}
          setHoveredPoint={setHoveredPoint}
          selectedMetric={selectedMetric}
          setSelectedMetric={setSelectedMetric}
          grootScore={grootScore}
        />
      </main>
    </>
  );
}

function generateMockHistory(plantId) {
  const now = Date.now();
  const points = [];
  const seed = plantId === "fernando-ficus" ? 1 : 2;
  for (let i = 0; i < 48; i++) {
    const t = now - (47 - i) * 30 * 60 * 1000;
    if (seed === 1) {
      points.push({
        timestamp: new Date(t),
        moisture: Math.max(5, Math.round(65 - i * 1.1 + Math.sin(i * 0.5) * 4)),
        humidity: Math.max(15, Math.round(40 - i * 0.3 + Math.cos(i * 0.4) * 3)),
        temperature: Math.round(14 + Math.sin(i * 0.2) * 2),
      });
    } else {
      points.push({
        timestamp: new Date(t),
        moisture: Math.round(48 + Math.sin(i * 0.3) * 6),
        humidity: Math.round(50 + Math.cos(i * 0.25) * 5),
        temperature: Math.round(23 + Math.sin(i * 0.15) * 1.5),
      });
    }
  }
  return points;
}

function SensorGauge({
  icon,
  label,
  value,
  subtitle,
  subtitleColor,
  percent,
  gradient,
  labels,
  lowThreshold,
  highThreshold,
  currentValue,
  helpText,
}) {
  const [showHelp, setShowHelp] = useState(false);
  const isLow = currentValue < lowThreshold;
  const isHigh = currentValue > highThreshold;
  const isIdeal = !isLow && !isHigh;

  return (
    <div className="bg-white rounded-2xl p-5 card-shadow border border-surface-dim/40 flex flex-col justify-between relative">
      <div className="flex items-center gap-2 text-on-surface-variant">
        {icon}
        <span className="font-body-sm text-xs font-semibold uppercase tracking-wider flex-1">
          {label}
        </span>
        {helpText && (
          <button onClick={() => setShowHelp(!showHelp)} className="cursor-help">
            <HelpCircle className={`w-3.5 h-3.5 transition-colors ${showHelp ? "text-primary" : "text-outline/50 hover:text-primary"}`} />
          </button>
        )}
      </div>
      {helpText && showHelp && (
        <div className="absolute top-full left-0 right-0 mt-1 z-40 bg-inverse-surface text-inverse-on-surface text-xs font-body-sm p-3 rounded-xl shadow-lg leading-relaxed">
          {helpText}
        </div>
      )}
      <div className="my-3 flex items-baseline gap-2">
        <span className="font-display font-bold text-3xl text-on-surface">
          {value}
        </span>
        {subtitle && (
          <span
            className={`font-body-sm text-xs font-medium ${subtitleColor || "text-outline"
              }`}
          >
            {subtitle}
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        <div className="relative h-2.5 w-full rounded-full overflow-visible">
          <div
            className="w-full h-full rounded-full shadow-inner"
            style={{ background: gradient }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-all duration-500 z-10"
            style={{ left: `${percent}%` }}
          >
            <div className="w-1.5 h-4 bg-on-surface rounded-full shadow-md border border-white/90" />
          </div>
        </div>
        <div className="flex justify-between text-[10px] font-body-sm text-outline px-0.5">
          <span className={isLow ? "text-error font-semibold" : ""}>
            {labels[0]}
          </span>
          <span className={isIdeal ? "text-primary font-semibold" : ""}>
            {labels[1]}
          </span>
          <span className={isHigh ? "text-error font-semibold" : ""}>
            {labels[2]}
          </span>
        </div>
      </div>
    </div>
  );
}

const TIMEFRAMES = [
  { key: "1h", label: "1 Hour", ms: 60 * 60 * 1000 },
  { key: "1d", label: "1 Day", ms: 24 * 60 * 60 * 1000 },
  { key: "1w", label: "1 Week", ms: 7 * 24 * 60 * 60 * 1000 },
];

const METRICS = [
  { key: "moisture", label: "Soil Moisture", unit: "%", color: "#56642b" },
  { key: "temperature", label: "Temperature", unit: "°C", color: "#b5651d" },
  { key: "humidity", label: "Humidity", unit: "%", color: "#2b6456" },
  { key: "grootScore", label: "Groot Score", unit: "", color: "#6b4ba3" },
];

function MetricChart({ historyData, timeframe, setTimeframe, hoveredPoint, setHoveredPoint, selectedMetric, setSelectedMetric, grootScore }) {
  const svgRef = useRef(null);
  const metric = METRICS.find((m) => m.key === selectedMetric) || METRICS[0];
  const now = Date.now();
  const tf = TIMEFRAMES.find((t) => t.key === timeframe) || TIMEFRAMES[1];
  const cutoff = now - tf.ms;

  const getValue = (p) => {
    if (metric.key === "grootScore") return p.grootScore ?? 0;
    return p[metric.key] ?? 0;
  };

  const chartData = metric.key === "grootScore"
    ? historyData.map((p) => {
        const m = p.moisture ?? 0;
        const t = p.temperature ?? 0;
        const h = p.humidity ?? 0;
        const ss = m >= 35 && m <= 70 ? 100 : m < 35 ? Math.max(0, (m / 35) * 100) : Math.max(0, ((100 - m) / 30) * 100);
        const ts = t >= 18 && t <= 26 ? 100 : t < 18 ? Math.max(0, 100 - (18 - t) * 12) : Math.max(0, 100 - (t - 26) * 12);
        const hs = h >= 40 && h <= 60 ? 100 : h < 40 ? Math.max(0, (h / 40) * 100) : Math.max(0, ((100 - h) / 40) * 100);
        return { ...p, grootScore: Math.round(ss * 0.4 + ts * 0.2 + hs * 0.2 + 20) };
      })
    : historyData;

  const filtered = chartData.filter((d) => d.timestamp.getTime() >= cutoff);
  const points = filtered.length > 0 ? filtered : chartData.slice(-20);
  const hasData = points.length > 0;

  const padW = 48;
  const padR = 16;
  const padT = 24;
  const padB = 36;
  const chartW = 800;
  const chartH = 240;
  const innerW = chartW - padW - padR;
  const innerH = chartH - padT - padB;

  let minV = 0, maxV = 100;
  if (hasData) {
    const vals = points.map(getValue);
    minV = Math.max(metric.key === "temperature" ? -10 : 0, Math.min(...vals) - 5);
    maxV = Math.min(metric.key === "temperature" ? 50 : 100, Math.max(...vals) + 5);
    if (maxV - minV < 10) { minV = Math.max(metric.key === "temperature" ? -10 : 0, minV - 5); maxV = maxV + 5; }
  }
  const tMin = hasData ? points[0].timestamp.getTime() : cutoff;
  const tMax = hasData ? points[points.length - 1].timestamp.getTime() : now;
  const tRange = Math.max(tMax - tMin, 1);

  const toX = (t) => padW + ((t - tMin) / tRange) * innerW;
  const toY = (v) => padT + innerH - ((v - minV) / (maxV - minV)) * innerH;

  const linePath = hasData
    ? points.map((p, i) => `${i === 0 ? "M" : "L"}${toX(p.timestamp.getTime()).toFixed(1)},${toY(getValue(p)).toFixed(1)}`).join(" ")
    : "";

  const areaPath = hasData
    ? `${linePath} L${toX(points[points.length - 1].timestamp.getTime()).toFixed(1)},${(padT + innerH).toFixed(1)} L${toX(points[0].timestamp.getTime()).toFixed(1)},${(padT + innerH).toFixed(1)} Z`
    : "";

  const yTicks = [];
  const step = maxV - minV <= 30 ? 10 : 20;
  for (let v = Math.ceil(minV / step) * step; v <= maxV; v += step) yTicks.push(v);

  const formatTime = (ts) => {
    const d = new Date(ts);
    if (timeframe === "1h" || timeframe === "1d") {
      return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const xLabelCount = timeframe === "1h" ? 4 : timeframe === "1d" ? 6 : 7;
  const xTicks = [];
  for (let i = 0; i < xLabelCount; i++) {
    const t = tMin + (tRange / (xLabelCount - 1)) * i;
    xTicks.push(t);
  }

  const handleMouseMove = (e) => {
    if (!hasData || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * chartW;
    const mouseT = tMin + ((mouseX - padW) / innerW) * tRange;
    let closest = points[0];
    let closestDist = Infinity;
    for (const p of points) {
      const dist = Math.abs(p.timestamp.getTime() - mouseT);
      if (dist < closestDist) { closestDist = dist; closest = p; }
    }
    setHoveredPoint(closest);
  };

  const formatValue = (p) => {
    const v = getValue(p);
    return metric.unit ? `${Math.round(v)}${metric.unit}` : Math.round(v);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 card-shadow border border-surface-dim/40">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => { setSelectedMetric(m.key); setHoveredPoint(null); }}
              className={`px-4 py-2 rounded-full font-body-sm text-xs font-semibold transition-all squish-press cursor-pointer whitespace-nowrap ${
                selectedMetric === m.key
                  ? "text-white shadow-xs"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high border border-surface-dim/60"
              }`}
              style={selectedMetric === m.key ? { backgroundColor: m.color } : {}}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          {TIMEFRAMES.map((t) => (
            <button
              key={t.key}
              onClick={() => setTimeframe(t.key)}
              className={`px-3.5 py-1.5 rounded-full font-body-sm text-xs font-semibold uppercase tracking-wider transition-all squish-press cursor-pointer ${
                timeframe === t.key
                  ? "bg-primary text-on-primary shadow-xs"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high border border-surface-dim/60"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div className="h-56 flex items-center justify-center text-on-surface-variant font-body-sm text-sm">
          No history data available yet. Sensor data will appear here.
        </div>
      ) : (
        <div className="relative" onMouseLeave={() => setHoveredPoint(null)}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${chartW} ${chartH}`}
            className="w-full h-auto"
            onMouseMove={handleMouseMove}
          >
            {yTicks.map((v) => (
              <g key={v}>
                <line x1={padW} y1={toY(v)} x2={chartW - padR} y2={toY(v)} stroke="#e4e2de" strokeWidth="1" />
                <text x={padW - 8} y={toY(v) + 4} textAnchor="end" fill="#79746d" fontSize="11" fontFamily="inherit">
                  {v}{metric.unit}
                </text>
              </g>
            ))}

            {xTicks.map((t, i) => (
              <text key={i} x={toX(t)} y={chartH - 4} textAnchor="middle" fill="#79746d" fontSize="11" fontFamily="inherit">
                {formatTime(t)}
              </text>
            ))}

            <defs>
              <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={metric.color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={metric.color} stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#metricGrad)" />
            <path d={linePath} fill="none" stroke={metric.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {points.map((p, i) => {
              if (points.length > 50 && i % Math.ceil(points.length / 30) !== 0) return null;
              return (
                <circle
                  key={i}
                  cx={toX(p.timestamp.getTime())}
                  cy={toY(getValue(p))}
                  r="3"
                  fill={metric.color}
                  stroke="white"
                  strokeWidth="1.5"
                  className="opacity-60"
                />
              );
            })}

            {hoveredPoint && (
              <g>
                <line
                  x1={toX(hoveredPoint.timestamp.getTime())}
                  y1={padT}
                  x2={toX(hoveredPoint.timestamp.getTime())}
                  y2={padT + innerH}
                  stroke={metric.color}
                  strokeWidth="1"
                  strokeDasharray="4 3"
                  opacity="0.5"
                />
                <circle
                  cx={toX(hoveredPoint.timestamp.getTime())}
                  cy={toY(getValue(hoveredPoint))}
                  r="5"
                  fill={metric.color}
                  stroke="white"
                  strokeWidth="2"
                />
              </g>
            )}
          </svg>

          {hoveredPoint && (
            <div
              className="absolute bg-inverse-surface text-inverse-on-surface text-xs font-body-sm px-3 py-2 rounded-lg shadow-lg z-30 pointer-events-none -translate-x-1/2"
              style={{
                left: `${((toX(hoveredPoint.timestamp.getTime())) / chartW) * 100}%`,
                top: `${((toY(getValue(hoveredPoint))) / chartH) * 100 - 14}%`,
              }}
            >
              <div className="font-semibold">{formatValue(hoveredPoint)}</div>
              <div className="text-[10px] text-primary-fixed-dim">
                {hoveredPoint.timestamp.toLocaleString([], {
                  month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
