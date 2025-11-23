import NavigationMenu from "../components/NavigationMenu.jsx";
import "./PageLayout.css";

export default function Home() {
  return (
    <div className="page-shell">
      <NavigationMenu />
      <main className="page-main">
        <h1 className="page__title">Welcome Home</h1>
        <p className="page__description">
          Home page reset. Start building from here.
        </p>
      </main>
    </div>
  );
}
