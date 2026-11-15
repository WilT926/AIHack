import { cn } from "@/components/ui";

export type TabItem<T extends string> = { id: T; label: string; count?: number };

/** Tabs as §9 chips: 13px 500 pills, active = ink. */
export function Tabs<T extends string>({
  items,
  active,
  onChange,
}: {
  items: TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div role="tablist" className="flex flex-wrap gap-2">
      {items.map((item) => {
        const on = item.id === active;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(item.id)}
            className={cn("ui-chip", on && "ui-chip--active")}
          >
            {item.label}
            {item.count !== undefined && (
              <span className={cn("ml-1.5 font-mono text-label-sm", on ? "text-white" : "text-grey-500")}>{item.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
