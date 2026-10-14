// Ladezustand in Kartenform (Eyebrow-, Titel- und Textbalken), kein Spinner.
export function DiscoverSkeleton() {
  return (
    <div className="dc" aria-busy="true" aria-label="Discover lädt">
      <header className="dc-head">
        <h1 className="dc-h1">Discover</h1>
        <div className="dc-head-row">
          <div className="dc-seg" aria-hidden="true">
            <button type="button" tabIndex={-1} aria-pressed="true">
              Intelligence
            </button>
            <button type="button" tabIndex={-1}>
              Learning
            </button>
          </div>
        </div>
        <div className="dc-chips" aria-hidden="true">
          {[56, 120, 132, 96].map((w) => (
            <span key={w} className="skeleton" style={{ width: w, height: 32, borderRadius: 999, flex: "none" }} />
          ))}
        </div>
      </header>
      <div className="dc-stage">
        <div className="dc-column">
          <div className="dc-feed">
            <div className="dc-card">
              <div className="dc-face">
                <div className="dc-body">
                  <div className="dc-content dc-skel">
                    <span className="skeleton" style={{ width: 110, height: 12 }} />
                    <span className="skeleton" style={{ width: "92%", height: 30 }} />
                    <span className="skeleton" style={{ width: "70%", height: 30 }} />
                    <span className="skeleton" style={{ width: "100%", height: 16, marginTop: 8 }} />
                    <span className="skeleton" style={{ width: "96%", height: 16 }} />
                    <span className="skeleton" style={{ width: "60%", height: 16 }} />
                    <span className="skeleton" style={{ width: 180, height: 13, marginTop: 8 }} />
                  </div>
                </div>
                <div className="dc-actions">
                  <span className="skeleton" style={{ flex: 1, height: 48, borderRadius: 999 }} />
                  <span className="skeleton" style={{ width: 64, height: 48, borderRadius: 14 }} />
                  <span className="skeleton" style={{ width: 64, height: 48, borderRadius: 14 }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
