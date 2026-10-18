import Link from "next/link";
import { STATES, stateFromSlug } from "@/lib/counties";

export default function Sidebar({ activeSlug, activePage }: { activeSlug?: string; activePage?: "frost" }) {
  const activeState = activeSlug ? stateFromSlug(activeSlug)?.code : undefined;
  return (
    <aside className="state-rail" aria-label="State navigation">
      <Link className="brand-mark" href="/states/nebraska" aria-label="Fieldwise home"><span>F</span></Link>
      <div className="rail-separator"><span>STATES</span></div>
      <nav className="state-nav">
        {STATES.map((state) => (
          <Link
            className={`state-tab ${activeState === state.code ? "selected" : ""}`}
            href={`/states/${state.slug}`}
            key={state.code}
            title={state.name}
            aria-label={state.name}
            aria-current={activeState === state.code ? "page" : undefined}
          >
            <span className="state-code">{state.code}</span>
            <span className="state-tab-name">{state.name}</span>
          </Link>
        ))}
      </nav>
      <div className="rail-separator"><span>TOOLS</span></div>
      <nav className="state-nav">
        <Link className={`state-tab ${activePage === "frost" ? "selected" : ""}`} href="/frost" title="Frost-safe planting calendar" aria-label="Frost-safe planting calendar" aria-current={activePage === "frost" ? "page" : undefined}>
          <span className="state-code">❄</span>
          <span className="state-tab-name">Frost</span>
        </Link>
      </nav>
      <div className="rail-foot"><span className="avatar">RC</span></div>
    </aside>
  );
}
