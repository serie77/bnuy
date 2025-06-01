import { motion } from 'framer-motion';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <div className={styles.links}>
          <a 
            href="https://x.com/bnuyfun" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.link}
          >
            𝕏
          </a>
          <span className={styles.dot}>•</span>
          <a 
            href="https://github.com/serie77/bnuy" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.link}
          >
            github
          </a>
        </div>
        <div className={styles.copyright}>
          made with 🐰 by serie
        </div>
      </div>
    </footer>
  );
};

export default Footer;