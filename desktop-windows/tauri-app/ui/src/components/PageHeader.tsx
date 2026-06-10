import type { ReactNode } from "react";

// Page header matching macOS pages: 18px semibold title, optional right actions,
// 24px h-padding / 18px top / 12px bottom, divider below.
export function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-omi-border/40 px-6 pb-3 pt-[18px]">
      <h1 className="text-[18px] font-semibold text-omi-text">{title}</h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
