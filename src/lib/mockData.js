// ─── App ─────────────────────────────────────────────────────────

export const appLogo = "/groot.png";

// ─── Plants ─────────────────────────────────────────────────────

export const plants = [
  {
    id: "monty-monstera",
    name: "Monty",
    species: "Monstera deliciosa",
    nickname: "Venis's Monstera",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD6L7UxfoJFoHeMKUUHEFW_Ib-UV07tptDUU0lDUUvtq8ZkNHgKMkTROVkRAKflob87WW0OZhO7cQBOCTRTxjmwgRorlwKRVfmRJlre2BklWw0tdwwLaPKT4pjsrZYbgc-_XzJC30lhRzdqx2leRm5z65-e74i7QJSgRt92SyyReool-HR54azRAGWYkeU6ofaNplJ6gQ4ROmrOc-W6QCvbk3ocRBmbKJ0bNRhKikXWHWCS5_pOUArm",
    heroImageUrl:
      "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=1000&q=80",
    status: "thirsty",
    statusLabel: "Feeling Thirsty",
    thoughtHeadline: "I'm feeling a little thirsty today.",
    thoughtDescription:
      "Soil moisture is dropping. A quick soak would make my leaves perk right up!",
    vitality: 94,
    vitalityStatusText: "Looking vibrant and healthy!",
    careStreak: 12,
    soilMoisture: 32,
    temperature: 72,
    humidity: 45,
    plantAgeDays: 12,
    adoptionDate: "Adopted 12 days ago",
    location: "Sunlit Living Room",
    wateringIntervalDays: 7,
    moistureHistory: [
      { day: "MON", value: 18, status: "low" },
      { day: "TUE", value: 15, status: "low" },
      { day: "WED", value: 25, status: "low" },
      {
        day: "THU",
        value: 92,
        status: "optimal",
        isWateredDay: true,
        notes: "Watered thoroughly",
      },
      { day: "FRI", value: 78, status: "optimal" },
      { day: "SAT", value: 60, status: "optimal" },
      { day: "TODAY", value: 32, status: "low" },
    ],
    totalWaterings: 8,
    totalCheckIns: 24,
    longestStreak: 12,
  },
  {
    id: "fernando-ficus",
    name: "Fernando",
    species: "Ficus microcarpa",
    nickname: "Venis's Ficus microcarpa",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuARbB6HN7mEUNhgT93aNZ3JUUH0nUhs-2xLZFmG4UfgKKi8ZhzPEPt6sJ9B_AnKuuoznd66bbNdWgaH72FerJvtXq6SMvpiQKSwQ9XB8u9ufLuAFPszfl9UOOl9Hs4SrqRgnQORUNphC0Jc417mAtO8t6KZtbV-cTKaFOvy_IsSDzD28zQohMKB-Vc5xRmKT-UvcbvRDnhzQy21najkJAEfMy-IZJduhKos0suo3Azdq1TylP_NHVEm",
    heroImageUrl:
      "https://images.unsplash.com/photo-1597055181300-e3633a917c9c?auto=format&fit=crop&w=1000&q=80",
    status: "critical",
    statusLabel: "Needs Attention",
    thoughtHeadline: "I'm feeling a bit neglected today...",
    thoughtDescription:
      "My leaves are drooping and I could really use some care.",
    vitality: 32,
    vitalityStatusText: "Critical levels reached. Immediate action recommended.",
    careStreak: 0,
    soilMoisture: 12,
    temperature: 57,
    humidity: 25,
    plantAgeDays: 38,
    adoptionDate: "Adopted 38 days ago",
    location: "Study Bookshelf",
    wateringIntervalDays: 5,
    moistureHistory: [
      { day: "MON", value: 65, status: "optimal" },
      { day: "TUE", value: 58, status: "optimal" },
      { day: "WED", value: 42, status: "optimal" },
      { day: "THU", value: 30, status: "low" },
      { day: "FRI", value: 20, status: "low" },
      { day: "SAT", value: 16, status: "low" },
      { day: "TODAY", value: 12, status: "dry" },
    ],
    totalWaterings: 5,
    totalCheckIns: 16,
    longestStreak: 7,
  },
  {
    id: "aura-snake",
    name: "Aura",
    species: "Sansevieria trifasciata",
    nickname: "Aura the Resilient",
    avatarUrl:
      "https://images.unsplash.com/photo-1593482892290-f54927ae1bf6?auto=format&fit=crop&w=300&q=80",
    heroImageUrl:
      "https://images.unsplash.com/photo-1593482892290-f54927ae1bf6?auto=format&fit=crop&w=1000&q=80",
    status: "optimal",
    statusLabel: "Thriving",
    thoughtHeadline: "Standing tall and breathing easy!",
    thoughtDescription:
      "Soaking in gentle indirect light and purifying your room air perfectly.",
    vitality: 98,
    vitalityStatusText: "Peak condition! Excellent resilient growth.",
    careStreak: 21,
    soilMoisture: 42,
    temperature: 73,
    humidity: 48,
    plantAgeDays: 60,
    adoptionDate: "Adopted 60 days ago",
    location: "Bedroom Window",
    wateringIntervalDays: 14,
    moistureHistory: [
      { day: "MON", value: 50, status: "optimal" },
      { day: "TUE", value: 48, status: "optimal" },
      { day: "WED", value: 46, status: "optimal" },
      { day: "THU", value: 45, status: "optimal" },
      { day: "FRI", value: 44, status: "optimal" },
      { day: "SAT", value: 43, status: "optimal" },
      { day: "TODAY", value: 42, status: "optimal" },
    ],
    totalWaterings: 4,
    totalCheckIns: 32,
    longestStreak: 21,
  },
];

// ─── Achievements ───────────────────────────────────────────────

export const achievements = [
  {
    id: "first-chat",
    title: "First Chat",
    description: "Spoke with Monty",
    iconName: "chat",
    unlocked: true,
    unlockedDate: "August 10, 2026",
    category: "chat",
  },
  {
    id: "7-day-streak",
    title: "7-Day Streak",
    description: "A week of care",
    iconName: "local_fire_department",
    unlocked: true,
    unlockedDate: "August 17, 2026",
    category: "streak",
  },
  {
    id: "plant-whisperer",
    title: "Plant Whisperer",
    description: "Understand needs",
    iconName: "psychology",
    unlocked: false,
    category: "care",
    progress: { current: 3, total: 5 },
  },
  {
    id: "monthly-bloom",
    title: "Monthly Bloom",
    description: "30 day streak",
    iconName: "local_florist",
    unlocked: false,
    category: "streak",
    progress: { current: 12, total: 30 },
  },
  {
    id: "hydration-hero",
    title: "Hydration Hero",
    description: "Keep moisture in ideal zone for 10 days",
    iconName: "water_drop",
    unlocked: false,
    category: "care",
    progress: { current: 6, total: 10 },
  },
  {
    id: "greenhouse-guardian",
    title: "Greenhouse Guardian",
    description: "Adopt 3 distinct plant species",
    iconName: "yard",
    unlocked: true,
    unlockedDate: "August 19, 2026",
    category: "growth",
  },
];

// ─── Chat Messages (per-plant) ──────────────────────────────────

export const chatMessages = {
  "monty-monstera": [
    {
      id: "msg-1",
      sender: "ai",
      text: "Hello there. I notice you've been a bit quiet lately. I'm feeling a little parched myself. How are you holding up today?",
      timestamp: "Today, 2:15 PM",
      plantId: "monty-monstera",
    },
    {
      id: "msg-2",
      sender: "user",
      text: "I just need to talk. Today was rough at work, and I feel overwhelmed.",
      timestamp: "Today, 2:16 PM",
      plantId: "monty-monstera",
    },
    {
      id: "msg-3",
      sender: "ai",
      text: "I hear you. It's perfectly okay to feel overwhelmed when things get heavy. Imagine yourself like a deep-rooted tree; the winds might blow hard on the branches, but your roots can hold you steady.\n\nTake a slow, deep breath with me. In... and out. Want to tell me a little more about what made it rough, or would you prefer a distraction?",
      timestamp: "Today, 2:17 PM",
      plantId: "monty-monstera",
    },
  ],
  "fernando-ficus": [
    {
      id: "f-msg-1",
      sender: "ai",
      text: "Hello friend... I'm feeling a little droopy and chilly over here on the bookshelf. Could we do a quick check-in?",
      timestamp: "Today, 1:40 PM",
      plantId: "fernando-ficus",
    },
  ],
  "aura-snake": [
    {
      id: "a-msg-1",
      sender: "ai",
      text: "Greetings! I'm standing strong by the window basking in the soft sunlight. Hope you're feeling centered today!",
      timestamp: "Today, 11:00 AM",
      plantId: "aura-snake",
    },
  ],
};

// ─── Suggested Chat Prompts ─────────────────────────────────────

export const suggestedPrompts = [
  "How are you doing today?",
  "What's the temperature like?",
  "Do you need water?",
  "Tell me about your day",
  "Any care tips for me?",
  "What's your soil feeling like?",
];

// ─── User Profile ───────────────────────────────────────────────

export const userProfile = {
  name: "Venis",
  avatarUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuB8fZAhz9ffbv-TzwomkKxifHCGRHAJHWk76zKGXag7n9vuTck9WbStxzDG0hvdw9XPggVaIGND-6aMWWf3vgapNsnkOo67U8XANGyrN9JehrdUXztSN9AJhMhU7hqysybrvlfrmPMKXT2Q_-WOBWnIBSTg9J2CS9zLtilM7-qdeLOAh3Z0pbItn3vJRjVI1ZLCLBJ-imTTfYGz8wF_FpIv-C9vNZ-8rv_R_IcbJHN2wpb0HvPl9kF4",
};

// ─── Notification Alerts ────────────────────────────────────────

export const notifications = [
  {
    id: 1,
    icon: "water_drop",
    title: "Monty needs water",
    description: "Soil moisture dropped below 35%",
    time: "10 min ago",
  },
  {
    id: 2,
    icon: "local_fire_department",
    title: "12-day streak!",
    description: "You're on a care roll — keep it up!",
    time: "1 hr ago",
  },
  {
    id: 3,
    icon: "warning",
    title: "Fernando critical",
    description: "Vitality dropped to 32%. Check in now.",
    time: "3 hrs ago",
  },
];
