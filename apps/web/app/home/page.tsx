"use client";

import { useEffect } from "react";
import { sendMessage } from "../../src/services/webSocket";
import { useSelector } from "react-redux";
import { RootState } from "../../src/store/store";

export default function Home() {
  return (
    <div>
      Home
      <Test />
    </div>
  );
}

const Test = () => {
  const app = useSelector((state: RootState) => state.app || {});

  console.log(app.date, "pppp");
  useEffect(() => {
    console.log("Test");
    setInterval(() => {
      console.log("sending message");
      sendMessage("app", { date: new Date().toISOString() });
    }, 2000);
  }, []);

  return <div>Test</div>;
};
