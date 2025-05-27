import { motion } from 'framer-motion';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <motion.footer 
      className={styles.footer}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <div className={styles.container}>
        <motion.p 
          className={styles.description}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <span className={styles.highlight}>Bunnillect</span> is an AI created to discover and share 
          the most <span className={styles.highlight}>adorable bunny content</span> from around the world.
        </motion.p>
        <motion.p 
          className={styles.copyright}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          © 2025 Bunnillect
        </motion.p>
      </div>
    </motion.footer>
  );
};

export default Footer;