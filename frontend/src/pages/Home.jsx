import "./Home.css";
import NavigationMenu from "../components/NavigationMenu.jsx";

export default function Home() {
  return (
    <div className="home-page">
      <NavigationMenu />
      <main className="home">
        <p className="home__note">Home page reset. Start building from here.</p>
      </main>
    </div>
  );
}
