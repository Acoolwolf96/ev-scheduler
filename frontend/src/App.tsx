import { useState } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import Nav from './Nav';
import HomePage from './pages/HomePage';
import PricesPage from './pages/PricesPage';
import SavingsPage from './pages/SavingsPage';
import AboutPage from './pages/AboutPage';
import type { HomePlanState } from './types';
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

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getInitialDeparture(): Date {
  const result = new Date();
  result.setDate(result.getDate() + 1);
  result.setHours(7, 0, 0, 0);
  return result;
}

const initialHomeState: HomePlanState = {
  currentPercent: 30,
  targetPercent: 80,
  preset: 'tomorrow-morning',
  departureTime: toLocalInputValue(getInitialDeparture()),
  preview: null,
  lastRequest: null,
  confirmedId: null,
  priceChangeNotice: null,
};

function App() {
  // Lives here, not inside HomePage, specifically so it survives navigating
  // away and back — React Router unmounts HomePage on route change, but
  // App itself never unmounts, so state stored here persists.
  const [homeState, setHomeState] = useState<HomePlanState>(initialHomeState);

  function updateHomeState(partial: Partial<HomePlanState>) {
    setHomeState((prev) => ({ ...prev, ...partial }));
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage state={homeState} update={updateHomeState} />} />
        <Route path="/prices" element={<PricesPage />} />
        <Route path="/savings" element={<SavingsPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Route>
    </Routes>
  );
}

export default App;
