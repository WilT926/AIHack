import { Pill } from "./Pill";

export type TabItem<T extends string> = { id: T; label: string; count?: number };

/** Pill tabs, as in the comment rail. */
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
      {items.map((item) => (
        <Pill
          key={item.id}
          role="tab"
          selected={item.id === active}
          variant={item.id === active ? "ink" : "outline"}
          onClick={() => onChange(item.id)}
        >
          {item.label}
          {item.count !== undefined && <span>{item.count}</span>}
        </Pill>
      ))}
    </div>
  );
}
