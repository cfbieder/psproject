import NavigationMenu from "../components/NavigationMenu.jsx";
import banner from "../assets/banner.png";
import "./PageLayout.css";

export default function Home() {
  return (
    <div className="page-shell">
      <NavigationMenu />
      <main className="page-main home-hero home-hero--single">
        <div className="home-hero__copy">
          <h1 className="page__title">Welcome Home</h1>
          <p className="page__description">
            Home page reset. Start building from here.
          </p>
        </div>
        <div className="home-hero__image home-hero__image--full">
          <img src={banner} alt="Financial insights banner" />
        </div>
      </main>
    </div>
  );
}
