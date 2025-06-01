import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import BunnyGrid from './components/BunnyGrid/BunnyGrid';
import TV from './pages/TV';
import Archive from './pages/Archive';
import Footer from './components/Footer/Footer';
import './styles/global.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<BunnyGrid />} />
            <Route path="/tv" element={<TV />} />
            <Route path="/archive" element={<Archive />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;