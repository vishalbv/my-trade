"use client";
import Clock from "../../components/clock";
import { STYLES } from "../../utils/constants";
import Drawer from "../Drawers/drawer";

export const Footer = () => {
  return (
    <div
      className="fixed bottom-0 z-[50] flex justify-between bg-nav w-fill"
      style={{ height: STYLES.footer.height }}
    >
      <div className="-mt-1 ml-2">
        <Clock simpleClock={true} />
      </div>
      <Drawer />
    </div>
  );
};
