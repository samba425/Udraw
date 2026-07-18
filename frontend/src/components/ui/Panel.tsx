/**
 * A titled surface panel with themed borders. Used by the sidebar, property
 * panel, and layers panel.
 * @module components/ui/Panel
 */

interface PanelSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

/** A labeled section within a side panel. */
export function PanelSection({
  title,
  children,
  className = '',
  actions,
}: PanelSectionProps): React.JSX.Element {
  return (
    <section className={`border-b bordered ${className}`}>
      {title && (
        <header className="flex items-center justify-between px-3 pb-1 pt-3">
          <h3
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {title}
          </h3>
          {actions}
        </header>
      )}
      <div className="px-3 pb-3 pt-1">{children}</div>
    </section>
  );
}
