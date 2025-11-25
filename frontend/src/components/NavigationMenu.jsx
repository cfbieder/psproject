import { Link } from "react-router-dom";
import banner from "../assets/banner.png";
import "./NavigationMenu.css";

const menuItems = [
  { label: "File", submenu: [{ label: "Upload PS", path: "/upload-ps" }] },
  { label: "Dashboard" },
  {
    label: "Reports",
    submenu: [
      { label: "Balance Summary", path: "/balance" },
      { label: "Cash Flow Summary", path: "/cash-flow" },
    ],
  },
  { label: "Transactions" },
  { label: "Help" },
];

export default function NavigationMenu() {
  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link className="navbar__brand" to="/">
          <div className="navbar__brand-image">
            <img src={banner} alt="Fin banner" />
          </div>
          <div className="navbar__brand-copy">
            <p className="navbar__title">Fin Workspace</p>
            <span className="navbar__subtitle">
              Balance · Cash flow · PS data
            </span>
          </div>
        </Link>
        <nav className="navbar__links">
          <Link className="navlink" to="/">
            Home
          </Link>
          {menuItems.map((item) =>
            item.submenu ? (
              <div key={item.label} className="dropdown">
                <button type="button" className="navlink navlink--dropdown">
                  <span>{item.label}</span>
                  <span aria-hidden>▾</span>
                </button>
                <div className="dropdown__menu">
                  {item.submenu.map((subItem) => (
                    <Link
                      key={subItem.label}
                      className="dropdown__link"
                      to={subItem.path}
                    >
                      {subItem.label}
                      <span className="dropdown__arrow" aria-hidden>
                        ↗
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : item.path ? (
              <Link key={item.label} className="navlink" to={item.path}>
                {item.label}
              </Link>
            ) : (
              <span key={item.label} className="navlink navlink--static">
                {item.label}
              </span>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
/*
export default function NavigationMenu() {
  return (
    <header className="home__menu">
      <div className="home__menu-inner">
        <img src={finIcon} alt="Fin logo" className="home__menu-icon" />
        <nav className="home__navbar">
          <Link to="/" className="home__navlink">
            Home
          </Link>
          {menuItems.map((item) =>
            item.submenu ? (
              <div key={item.label} className="home__dropdown">
                <button type="button" className="home__dropbtn">
                  {item.label}
                </button>
                <div className="home__dropdown-content">
                  {item.submenu.map((subItem) => (
                    <Link
                      key={subItem.label}
                      className="home__dropdown-link"
                      to={subItem.path}
                    >
                      {subItem.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <span key={item.label} className="home__navlink home__navlink--static">
                {item.label}
              </span>
            ),
          )}
        </nav>
      </div>
    </header>
  );
}
*/
