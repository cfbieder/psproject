import finIcon from "../assets/fin.png";
import "./NavigationMenu.css";

const menuItems = ["File", "Dashboard", "Reports", "Help"];

export default function NavigationMenu() {
  return (
    <header className="home__menu">
      <div className="home__menu-inner">
        <img src={finIcon} alt="Fin logo" className="home__menu-icon" />
        <ul className="home__menu-list">
          {menuItems.map((item) => (
            <li key={item}>
              <button type="button" className="home__menu-item">
                {item}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
