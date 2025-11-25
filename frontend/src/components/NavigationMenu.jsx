import { Link } from "react-router-dom";
import banner from "../assets/banner.png";
import "./NavigationMenu.css";

const menuItems = [
  { label: "Home", path: "/" },
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
      <div className="navbar__brand">
        <img src={banner} alt="Fin banner" />
      </div>
      <nav className="navbar__links">
        {menuItems.map((item) =>
          item.submenu ? (
            <div key={item.label} className="dropdown">
              <button className="dropbtn">
                {item.label}
                <i className="fa fa-caret-down"></i>
              </button>
              <div className="dropdown-content">
                {item.submenu.map((subItem) => (
                  <Link key={subItem.label} to={subItem.path}>
                    {subItem.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <Link key={item.label} className="navlink" to={item.path || "#"}>
              {item.label}
            </Link>
          )
        )}
      </nav>
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
