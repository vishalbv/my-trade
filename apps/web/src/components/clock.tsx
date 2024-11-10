"use client";
import { memo, useEffect } from "react";
import React from "react";
import moment from "moment";
import { useState } from "react";

import styles from "./clock.module.scss";
import { _setInterval } from "../utils/helpers";
import { ActiveDot } from "./activeDot";

// import { _setInterval } from "../../helpers/helperFunctions";
let intervalVal: ReturnType<typeof window.setInterval> | null = null;
let marketStatus = {
  activeStatus: false,
  preMarketStatus: false,
  isHoliday: false,
};

interface TimeState {
  date: string;
  day: string;
  hours: string;
  minutes: string;
  seconds: string;
  aa: string;
  _date: moment.Moment;
}

const Clock = memo(({ simpleClock }: { simpleClock?: boolean }) => {
  const [time, setTime] = useState<TimeState>({
    date: "",
    day: "",
    hours: "",
    minutes: "",
    seconds: "",
    aa: "",
    _date: moment(),
  });
  // const { marketStatus = {} } = useSelector((s) => s.app);
  useEffect(() => {
    setTime({ ...getTimeAndDate() });

    intervalVal = _setInterval(() => {
      setTime({ ...getTimeAndDate() });
    }, 1000);

    return () => {
      if (intervalVal) clearInterval(intervalVal);
    };
  }, []);

  if (simpleClock) {
    return (
      <div className="text-sm flex items-center justify-between text-muted-foreground text-center">
        <span>{time._date?.format("ddd D MMM") || ""}</span>
        <ActiveDot
          status={marketStatus.activeStatus}
          readyStatus={marketStatus.preMarketStatus}
        />
        <span>{time._date?.format("hh:mm:ss a") || ""}</span>
      </div>
    );
  }

  return (
    <div className={`${styles.clock} font-sura`}>
      <div>
        <span>{time.hours}</span> : <span>{time.minutes}</span> :{" "}
        <span>{time.seconds}</span>
        <span>{" " + time.aa}</span>
      </div>

      <div>
        <span>{time.day}</span>
        <span>{time.date}</span>
      </div>
      <div>
        <ActiveDot
          status={marketStatus.activeStatus}
          readyStatus={marketStatus.preMarketStatus}
        />
        <span className="font-initial">
          {marketStatus.isHoliday
            ? "Holiday Today"
            : marketStatus.activeStatus
              ? "market opened"
              : "market closed"}
        </span>
      </div>
    </div>
  );
});

export default Clock;

const getTimeAndDate = () => {
  let date = moment().format("DD/MM/yyyy:dddd:hh:mm:ss:a");
  let arr = date.split(":");
  console.log(arr);

  return {
    date: arr[0] || "",
    day: arr[1] || "",
    hours: arr[2] || "",
    minutes: arr[3] || "",
    seconds: arr[4] || "",
    aa: arr[5] || "",
    _date: moment(),
  };
};
