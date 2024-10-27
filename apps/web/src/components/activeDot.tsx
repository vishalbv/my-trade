import styles from "./activeDot.module.scss";

export const ActiveDot = ({
  status,
  readyStatus,
}: {
  status: boolean;
  readyStatus: boolean;
}) => {
  return (
    <span className={styles.pulseDot}>
      {status && <span className={styles.ringring}></span>}
      <span
        className={styles.circle}
        style={{
          background: status ? "#62bd19" : readyStatus ? "orange" : "red",
        }}
      ></span>
    </span>
  );
};
