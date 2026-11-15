"use client";

// The avatar picked in the avatar studio. Kept on this device only until the
// data layer can save it to the profile (Lane 1, src/lib/data).
import { useSyncExternalStore } from "react";

const KEY = "panel.avatar";
const EVENT = "panel:avatar";

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function read(): string | null {
  try {
    const v = window.localStorage.getItem(KEY);
    return v && /^avatar-\d{3}$/.test(v) ? v : null;
  } catch {
    return null;
  }
}

/** The chosen avatar, or `fallback` (the profile's own) when none is chosen. */
export function useChosenAvatar(fallback: string): string {
  return useSyncExternalStore(subscribe, read, () => null) ?? fallback;
}

export function chooseAvatar(avatar: string | null) {
  try {
    if (avatar) window.localStorage.setItem(KEY, avatar);
    else window.localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: the choice lasts for this page only.
  }
  window.dispatchEvent(new Event(EVENT));
}
