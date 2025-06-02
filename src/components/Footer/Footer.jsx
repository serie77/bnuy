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
        </div>
        <div className={styles.copyright}>
          made with 🐰 by the bnuy community
        </div>
      </div>
    </footer>
  );
};

export default Footer;