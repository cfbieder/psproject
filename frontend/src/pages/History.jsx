import NavigationMenu from "../components/NavigationMenu.jsx";
import "./PageLayout.css";

export default function History() {
  return (
    <div className="page-shell">
      <NavigationMenu />
      <main className="page-main">
        <section className="home-hero" style={{ gridColumn: "1 / -1" }}>
          <div className="home-hero__copy">
            <h1 className="page__title">History</h1>
            <p className="page__description">
              Review past activity and transaction details here. Content coming
              soon.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
