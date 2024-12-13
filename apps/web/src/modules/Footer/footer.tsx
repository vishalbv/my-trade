"use client";
import Clock from "../../components/clock";
import Drawer from "../Drawers/drawer";

export const Footer = () => {
  return (
    <div className="fixed bottom-0 z-[50] flex justify-between bg-nav w-fill">
      <Clock simpleClock={true} />
      <Drawer />
    </div>
  );
};
