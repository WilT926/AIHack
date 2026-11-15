"use client";

// A small menu that opens on hover (with a short grace period so the pointer
// can travel into it), on click, or from the keyboard. Escape or a click
// outside closes it. Used by the profile menu and the search pill's filters.
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "./index";

const CLOSE_DELAY_MS = 160;

export function Popover({
  trigger,
  label,
  triggerClassName,
  onTriggerClick,
  align = "end",
  side = "bottom",
  open: openProp,
  onOpenChange,
  bare,
  hover = true,
  className,
  children,
}: {
  trigger: ReactNode;
  /** Accessible name of the trigger. */
  label: string;
  triggerClassName?: string;
  /** Replaces the default click (toggle). Hover and keyboard still open the menu. */
  onTriggerClick?: () => void;
  align?: "start" | "center" | "end";
  /** Open below the trigger (default) or above it, e.g. from the dock. */
  side?: "bottom" | "top";
  /** Controlled open state (optional). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** No box around the content (the dock's "+" shows floating pills). */
  bare?: boolean;
  /** Open on hover (default). Off: click or keyboard only. */
  hover?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = useCallback(
    (next: boolean | ((o: boolean) => boolean)) => {
      const value = typeof next === "function" ? next(open) : next;
      setOpenState(value);
      onOpenChange?.(value);
    },
    [open, onOpenChange],
  );
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  /** Opened by hover: the click that usually follows keeps it open instead of closing it. */
  const viaHover = useRef(false);

  const show = (hover = false) => {
    window.clearTimeout(timer.current);
    if (!open) viaHover.current = hover;
    setOpen(true);
  };
  const hide = (delay = CLOSE_DELAY_MS) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(false), delay);
  };

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (e.target instanceof Node && !ref.current?.contains(e.target)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", esc);
    };
  }, [open, setOpen]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <div
      ref={ref}
      className={cn("ui-popover", className)}
      data-open={open}
      onPointerEnter={(e) => {
        // Hover only for a mouse or pen; touch opens on tap instead.
        if (hover && e.pointerType !== "touch") show(true);
      }}
      onPointerLeave={(e) => {
        if (hover && e.pointerType !== "touch") hide();
      }}
      onBlur={(e) => {
        if (!(e.relatedTarget instanceof Node && ref.current?.contains(e.relatedTarget))) hide(0);
      }}
    >
      <button
        type="button"
        className={triggerClassName}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            show();
          }
        }}
        onClick={
          onTriggerClick ??
          (() => {
            if (open && viaHover.current) viaHover.current = false;
            else setOpen((o) => !o);
          })
        }
      >
        {trigger}
      </button>
      {open && (
        <div
          className="ui-popover__panel"
          data-align={align}
          data-side={side}
          onClick={(e) => {
            // Close once a link or menu item has been chosen (plain buttons can step inside the menu).
            if (e.target instanceof Element && e.target.closest("a, [role^='menuitem']")) setOpen(false);
          }}
        >
          <div className={cn("ui-popover__box", bare && "ui-popover__box--bare")} role="menu" aria-label={label}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export function MenuSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="ui-menu__section" role="group" aria-label={title}>
      {title && <span className="ui-menu__title">{title}</span>}
      {children}
    </div>
  );
}

export function MenuItem({
  href,
  onClick,
  selected,
  icon,
  hint,
  children,
}: {
  href?: string;
  onClick?: () => void;
  selected?: boolean;
  icon?: ReactNode;
  hint?: string;
  children: ReactNode;
}) {
  const body = (
    <>
      {icon && <span className="ui-menu__icon">{icon}</span>}
      <span className="ui-menu__text">{children}</span>
      {hint && <span className="ui-menu__hint">{hint}</span>}
      {selected && <i className="ui-menu__check" aria-hidden />}
    </>
  );
  if (href) {
    return (
      <Link href={href} role="menuitem" className="ui-menu__item" data-selected={selected}>
        {body}
      </Link>
    );
  }
  return (
    <button type="button" role="menuitemradio" aria-checked={!!selected} className="ui-menu__item" data-selected={selected} onClick={onClick}>
      {body}
    </button>
  );
}
