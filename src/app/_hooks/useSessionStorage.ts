'use client';

import { useState, useEffect, type SetStateAction, type Dispatch } from 'react';

// only use this if you have a state that must be synced with a variable in session storage
export function useSessionStorageState<T>(
  key: string,
  defaultValue: T
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(defaultValue);

  // This effect runs once on the client to safely read from sessionStorage
  // without causing a server-client hydration mismatch.
  useEffect(() => {
    const storedValue = sessionStorage.getItem(key);
    if (storedValue !== null) {
      try {
        setValue(JSON.parse(storedValue));
      } catch {
        setValue(defaultValue);
      }
    }
  }, [key, defaultValue]);

  // This effect runs whenever the value changes, writing it back to sessionStorage.
  useEffect(() => {
    sessionStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
