"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

let previousBox: { left: number; top: number } | undefined;

/** Preserve the dock's position between route layouts without stretching its buttons. */
export function DockMotion({ className, children }: { className: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const box = node.getBoundingClientRect();
    let animation: Animation | undefined;
    if (previousBox && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const dx = previousBox.left - box.left;
      const dy = previousBox.top - box.top;
      // Individual translate preserves the page dock's existing centring transform.
      if (dx || dy) animation = node.animate([{ translate: `${dx}px ${dy}px` }, { translate: "0px 0px" }], { duration: 550, easing: "cubic-bezier(.3, 1.35, .45, 1)" });
    }
    const remember = () => {
      const current = node.getBoundingClientRect();
      if (current.width && current.height) previousBox = { left: current.left, top: current.top };
    };
    remember();
    void animation?.finished.then(remember, () => {});
    document.addEventListener("click", remember, true);
    return () => { remember(); animation?.cancel(); document.removeEventListener("click", remember, true); };
  }, []);
  return <div ref={ref} className={className}>{children}</div>;
}
