import { Routes, Route, Outlet } from 'react-router-dom';
import Nav from './Nav';
import HomePage from './pages/HomePage';
import PricesPage from './pages/PricesPage';
import SavingsPage from './pages/SavingsPage';
import AboutPage from './pages/AboutPage';
import './App.css';

function Layout() {
  return (
    <div className="page">
      <Nav />
      <div className="panel wide">
        <Outlet />
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/prices" element={<PricesPage />} />
        <Route path="/savings" element={<SavingsPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Route>
    </Routes>
  );
}

export default App;
