# Data Integration Guide

How to swap a mock value for a live Firebase Realtime Database read.

## Worked Example: Moisture %

### 1. Before (mock data)

```js
// src/app/dashboard/page.js
import { sensorData } from "@/lib/mockData";

export default function Dashboard() {
  return <p>Moisture: {sensorData.moisture}%</p>;
}
```

### 2. Install Firebase

```bash
npm install firebase
```

### 3. Create Firebase config

```js
// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL:       process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
```

Add your keys to `.env.local` (never commit this file):

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-key
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
# ... etc
```

### 4. Create a hook for real-time reads

```js
// src/hooks/useFirebaseValue.js
"use client";
import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

export function useFirebaseValue(path, fallback) {
  const [value, setValue] = useState(fallback);

  useEffect(() => {
    const unsubscribe = onValue(ref(db, path), (snapshot) => {
      setValue(snapshot.val() ?? fallback);
    });
    return unsubscribe;
  }, [path, fallback]);

  return value;
}
```

### 5. After (live data with mock fallback)

```js
// src/app/dashboard/page.js
"use client";
import { useFirebaseValue } from "@/hooks/useFirebaseValue";
import { sensorData } from "@/lib/mockData";

export default function Dashboard() {
  // Reads from Firebase path "sensors/moisture", falls back to mock value
  const moisture = useFirebaseValue("sensors/moisture", sensorData.moisture);

  return <p>Moisture: {moisture}%</p>;
}
```

## Pattern Summary

For any value you want to make live:

1. Find the mock import (e.g. `sensorData.temperature`)
2. Replace it with `useFirebaseValue("your/firebase/path", sensorData.temperature)`
3. Add `"use client"` to the top of the file if not already there

The mock value serves as the fallback, so the app keeps working even if Firebase isn't configured yet.
