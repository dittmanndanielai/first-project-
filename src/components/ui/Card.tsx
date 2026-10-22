/** Karte mit Kopfzeile (Titel links, Zusatz rechts), wie im Design. Ersetzt handgebaute Inline-Styles (F11). */
export function Card({
  id,
  title,
  aside,
  className = "",
  children,
}: {
  id: string;
  title: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`card card-pad ${className}`} aria-labelledby={id}>
      <div className="card-head">
        <h2 id={id} className="card-title">
          {title}
        </h2>
        {aside ? <span className="card-aside">{aside}</span> : null}
      </div>
      {children}
    </section>
  );
}
