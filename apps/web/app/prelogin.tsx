"use client";
import styles from "./prelogin.module.css";
import Clock from "../src/components/clock";
import AppLogo from "../src/components/appLogo";
import { ThemeSwitcher } from "../src/components/ThemeSwitcher";

import "../app/globalStyles/animatedBackground.scss";

export default function PreLogin({
  children,
}: {
  isLoginPage?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={styles.page}>
      <AnimatedBackground />
      <div className="scale-150 mb-12">
        <AppLogo />
      </div>
      <div className="text-2xl font-medium">
        welcome to my-trade app <br /> make strategies and activate...
      </div>
      <div className="text-6xl my-4">
        <Clock />
      </div>
      {children}
      {/* <ActiveDot status={true} readyStatus={true} /> */}
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>
    </div>
  );
}

const AnimatedBackground = () => {
  return (
    <div className="lines">
      <div className="line"></div>
      <div className="line"></div>
      <div className="line"></div>
      <div className="line"></div>
    </div>
  );
};
