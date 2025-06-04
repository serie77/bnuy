import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import BunnyGrid from './components/BunnyGrid/BunnyGrid';
import TV from './pages/TV';
import Archive from './pages/Archive';
import Vote from './pages/Vote';
import Footer from './components/Footer/Footer';
import SolanaWalletProvider from './components/WalletProvider';
import './styles/global.css';

function App() {
  return (
    <SolanaWalletProvider>
      <Router>
        <div className="app">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<BunnyGrid />} />
              <Route path="/tv" element={<TV />} />
              <Route path="/archive" element={<Archive />} />
              <Route path="/upload" element={<Vote />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </SolanaWalletProvider>
  );
}

export default App;