import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import GetFirstPokemon from './pages/GetFirstPokemon';
import SelectPokemon from './pages/SelectPokemon';
import Battle from './pages/Battle';
import Waiting from './pages/Waiting';
import MarketPlace from './pages/MarketPlace';
import Game from './pages/Game';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/get-first-pokemon" element={<GetFirstPokemon />} />
          <Route path="/select-pokemon" element={<SelectPokemon />} />
          <Route path="/battle" element={<Battle />} />
          <Route path="/battle/lobby/:code" element={<Waiting />} />
          <Route path="/market-place" element={<MarketPlace />} />
          <Route path="/battle/game/:code" element={<Game />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
