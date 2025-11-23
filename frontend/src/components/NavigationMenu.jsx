import { Link } from "react-router-dom";
import finIcon from "../assets/fin.png";
import "./NavigationMenu.css";

const menuItems = [
  { label: "File" },
  { label: "Dashboard" },
  {
    label: "Reports",
    submenu: [{ label: "Balance Summary", path: "/balance" }],
  },
  { label: "Help" },
];

export default function NavigationMenu() {
  return (
    <header className="home__menu">
      <div className="home__menu-inner">
        <img src={finIcon} alt="Fin logo" className="home__menu-icon" />
        <ul className="home__menu-list">
          {menuItems.map((item) => (
            <li key={item.label} className="home__menu-item-wrapper">
              <button type="button" className="home__menu-item">
                {item.label}
              </button>
              {item.submenu && (
                <ul className="home__submenu">
                  {item.submenu.map((subItem) => (
                    <li key={subItem.label}>
                      <Link className="home__submenu-link" to={subItem.path}>
                        {subItem.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}

//todo: make menu items below main menu item drop down on hover
