"use client";

// Keeps the shell steady between pages. Each page renders its own top bar and
// dock, so on navigation they remount; this remembers where an element was
// and glides the new one from there (a FLIP animation), instead of jumping.
import { useLayoutEffect, type RefObject } from "react";

const last = new Map<string, DOMRect>();

export function useGlide(ref: RefObject<HTMLElement | null>, key: string) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const prev = last.get(key);
    let anim: Animation | undefined;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prev && !reduce) {
      const dx = prev.left + prev.width / 2 - (box.left + box.width / 2);
      const dy = prev.top + prev.height / 2 - (box.top + box.height / 2);
      const sx = box.width ? prev.width / box.width : 1;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1 || Math.abs(sx - 1) > 0.01) {
        // `translate` and `scale` compose with any centring transform already on the element.
        anim = el.animate(
          [
            { translate: `${dx}px ${dy}px`, scale: `${sx} 1` },
            { translate: "0px 0px", scale: "1 1" },
          ],
          { duration: 480, easing: "cubic-bezier(.3, 1.25, .45, 1)" },
        );
      }
    }
    const remember = () => {
      const r = el.getBoundingClientRect();
      if (r.width && r.height) last.set(key, r);
    };
    remember();
    void anim?.finished.then(remember, () => {});
    window.addEventListener("resize", remember);
    return () => {
      // Runs before the old page's DOM is removed, so this is where it was.
      if (!anim || anim.playState === "finished") remember();
      anim?.cancel();
      window.removeEventListener("resize", remember);
    };
  }, [ref, key]);
}

/** The dock's last active position, so the white circle slides on the next page. */
export const dockMemory = { activeX: null as number | null };
