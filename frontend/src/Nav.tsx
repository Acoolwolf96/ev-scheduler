import { NavLink } from 'react-router-dom';

function Nav() {
  return (
    <header className="header">
      <div className="header-inner">
        <span className="brand">Smart EV Charging</span>
        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Home
          </NavLink>
          <NavLink to="/prices" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Prices
          </NavLink>
          <NavLink to="/savings" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Savings
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            About
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default Nav;
