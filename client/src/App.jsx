import { Navigate, Route, Routes } from 'react-router-dom';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Search from './pages/Search';
import { getFlag } from './lib/storage';

// First-time visitors see the onboarding screen once.
function RequireOnboarded({ children }) {
  return getFlag('onboarded') ? children : <Navigate to="/welcome" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/welcome" element={<Onboarding />} />
      <Route path="/" element={<RequireOnboarded><Home /></RequireOnboarded>} />
      <Route path="/search" element={<Search />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
