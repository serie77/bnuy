import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import BunnyGrid from './components/BunnyGrid/BunnyGrid';
import TV from './pages/TV';
import Archive from './pages/Archive';
import './styles/global.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <Routes>
          <Route path="/" element={<BunnyGrid />} />
          <Route path="/tv" element={<TV />} />
          <Route path="/archive" element={<Archive />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;