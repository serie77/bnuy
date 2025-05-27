import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Header.module.css';

function Header() {
  const [isDark, setIsDark] = useState(true);
  const location = useLocation();

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.body.classList.toggle('light-mode');
  };

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link to="/" className={styles.logoText}>bnuy</Link>
        <div className={styles.controls}>
          <a 
            href="https://x.com/bnuyfun" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.xLink}
            aria-label="Follow on X"
          >
            𝕏
          </a>
          <Link 
            to="/tv" 
            className={`${styles.navButton} ${location.pathname === '/tv' ? styles.active : ''}`}
          >
            tv
          </Link>
          <Link 
            to="/archive" 
            className={`${styles.navButton} ${location.pathname === '/archive' ? styles.active : ''}`}
          >
            archive
          </Link>
          <button 
            className={styles.iconButton}
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>
    </header>
  );
}

export default Header;