import { PageHeader } from "@/components/PageHeader";

// Placeholder for pages not yet built on Windows (Rewind, Apps), styled to match.
export function ComingSoonPage({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex h-full flex-col">
      <PageHeader title={title} />
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <h2 className="text-[16px] font-semibold text-omi-text2">Coming soon</h2>
        <p className="max-w-sm text-[13px] text-omi-text3">{subtitle}</p>
      </div>
    </div>
  );
}
