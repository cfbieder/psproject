import { Link } from "react-router-dom";
import NavigationMenu from "../components/NavigationMenu.jsx";
import banner from "../assets/banner.png";
import "./PageLayout.css";

export default function Home() {
  return (
    <div className="page-shell">
      <NavigationMenu />
      <main className="page-main home-hero">
        <div className="home-hero__copy">
          <span className="home-hero__eyebrow">Financial workspace</span>
          <h1 className="page__title">Operate with clarity and confidence.</h1>
          <p className="page__description">
            Keep balance sheets, cash flow, and PS data in one calm, purposeful
            UI. Run the reports you need, drill into the details, and keep every
            import accountable.
          </p>
          <div className="home-hero__actions">
            <Link className="home-cta home-cta--primary" to="/balance">
              Balance summary
            </Link>
            <Link className="home-cta home-cta--ghost" to="/cash-flow">
              Cash flow overview
            </Link>
            <Link className="home-cta" to="/upload-ps">
              Upload PS CSV
            </Link>
          </div>
          <div className="home-grid">
            <div className="home-card">
              <p className="home-card__title">Ready-to-run reports</p>
              <p className="home-card__meta">
                Generate up to three periods side-by-side with collapsible
                drilldowns and clean currency formatting.
              </p>
            </div>
            <div className="home-card">
              <p className="home-card__title">PS data stewardship</p>
              <p className="home-card__meta">
                Upload, clear, and analyze PS data with clear status messages
                and confirmations before destructive actions.
              </p>
            </div>
            <div className="home-card">
              <p className="home-card__title">Built for focus</p>
              <p className="home-card__meta">
                Minimal navigation, crisp typography, and intentional whitespace
                keep the numbers front and center.
              </p>
            </div>
          </div>
        </div>
        <div className="home-hero__image">
          <img src={banner} alt="Financial insights banner" />
        </div>
      </main>
    </div>
  );
}
