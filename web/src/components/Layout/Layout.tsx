import { NavLink, Outlet } from 'react-router-dom';
import { NAV } from '../../nav';
import './Layout.css';

export default function Layout() {
  return (
    <div className="layout">
      <header className="layout__header">
        <strong>DECLARIA</strong>
        <nav className="layout__nav">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }: { isActive: boolean }) => (isActive ? 'is-active' : '')}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <Outlet />
    </div>
  );
}
