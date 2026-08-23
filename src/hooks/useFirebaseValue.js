"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

export function useFirebaseValue(path, fallback) {
  const [value, setValue] = useState(fallback);

  useEffect(() => {
    const unsubscribe = onValue(
      ref(db, path),
      (snapshot) => {
        setValue(snapshot.val() ?? fallback);
      },
      () => {
        setValue(fallback);
      }
    );
    return unsubscribe;
  }, [path, fallback]);

  return value;
}
