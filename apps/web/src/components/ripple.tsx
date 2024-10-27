import styles from "./ripple.module.scss";

export default function Ripple() {
  return (
    <div className={styles.loaderContainer}>
      <div className={styles.ripple}></div>
    </div>
  );
}
