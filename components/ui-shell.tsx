import type { ReactNode } from 'react';

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export function SectionShell({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cx('app-card p-4 sm:p-5 md:p-6', className)}>{children}</section>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1.5">
        <p className="app-eyebrow">{eyebrow}</p>
        <h1 className="app-title">{title}</h1>
        {description ? <p className="max-w-3xl text-sm text-slate-300">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function StatusBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent' }) {
  const toneClass =
    tone === 'success'
      ? 'border-emerald-300/30 bg-emerald-500/15 text-emerald-100'
      : tone === 'warning'
        ? 'border-amber-300/30 bg-amber-500/15 text-amber-100'
        : tone === 'danger'
          ? 'border-rose-300/30 bg-rose-500/15 text-rose-100'
          : tone === 'accent'
            ? 'border-fuchsia-300/30 bg-fuchsia-500/15 text-fuchsia-100'
            : 'border-slate-400/30 bg-slate-500/10 text-slate-200';

  return <span className={cx('inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold', toneClass)}>{children}</span>;
}

export function EmptyState({ title, description, action, icon = '🏐' }: { title: string; description: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="app-card-muted flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-600/80 p-6 text-center">
      <div className="text-4xl" aria-hidden="true">{icon}</div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="max-w-2xl text-sm text-slate-300">{description}</p>
      {action}
    </div>
  );
}
