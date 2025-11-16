import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Web3Provider } from './context/Web3Context';
import Home from './pages/Home';
import WalletLogin from './pages/WalletLogin';
import SetName from './pages/SetName';
import Dashboard from './pages/Dashboard';
import GetFirstPokemon from './pages/GetFirstPokemon';
import SelectPokemon from './pages/SelectPokemon';
import Battle from './pages/Battle';
import Waiting from './pages/Waiting';
import MarketPlace from './pages/MarketPlace';
import Game from './pages/Game';
import Profile from './pages/Profile';
import CrossChainLeaderboard from './pages/CrossChainLeaderboard';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <Web3Provider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<WalletLogin />} />
            <Route path="/signup" element={<WalletLogin />} />
            <Route path="/set-name" element={<SetName />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/get-first-pokemon" element={<GetFirstPokemon />} />
            <Route path="/select-pokemon" element={<SelectPokemon />} />
            <Route path="/battle" element={<Battle />} />
            <Route path="/battle/lobby/:code" element={<Waiting />} />
            <Route path="/market-place" element={<MarketPlace />} />
            <Route path="/battle/game/:code" element={<Game />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/crosschain-leaderboard" element={<CrossChainLeaderboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </Web3Provider>
    </BrowserRouter>
  );
}

export default App;
