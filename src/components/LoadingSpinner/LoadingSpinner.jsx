import styles from './LoadingSpinner.module.css';

function LoadingSpinner({ message = "loading..." }) {
  return (
    <div className={styles.container}>
      <div className={styles.spinner}></div>
      <p className={styles.text}>{message}</p>
    </div>
  );
}

export default LoadingSpinner; 