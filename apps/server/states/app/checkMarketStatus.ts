import { getTimeoutTo, isDatesEqual } from "@repo/utils/helpers";
import moment from "moment";

export const updateMarketStatus = ({
  holidays,
  setState,
}: {
  holidays: string[];
  setState: any;
}) => {
  let now = moment(moment().format("hh:mm:ss a"), "h:mm:ss a");

  let isHoliday =
    now.days() == 0 ||
    now.days() == 6 ||
    holidays.some(([i]: string) => isDatesEqual(moment(i, "DD-MMM-YYYY")));

  let times = [
    {
      time: "00:00:00 am",
      status: {
        isHoliday,
        activeStatus: false,
        preMarketStatus: false,
        status: 0,
      },
    },
    {
      time: "09:00:00 am",
      status: {
        isHoliday,
        activeStatus: false,
        preMarketStatus: true,
        status: 1,
      },
    },
    {
      time: "09:08:00 am",
      status: {
        isHoliday,
        activeStatus: false,
        preMarketStatus: false,
        status: 2,
      },
    },
    {
      time: "09:15:00 am",
      status: {
        isHoliday,
        activeStatus: true,
        preMarketStatus: false,
        status: 3,
      },
    },
    {
      time: "03:30:01 pm",
      status: {
        isHoliday,
        activeStatus: false,
        preMarketStatus: false,
        status: 4,
      },
      callback: () => {
        // generateReport();
      },
    },
  ];
  let index = times.findIndex((i) => now.isBefore(moment(i.time, "h:mm:ss a")));
  if (isHoliday || index == -1)
    return setState({
      isHoliday,
      activeStatus: false,
      preMarketStatus: false,
      status: 0,
    });
  times[index - 1] && setState(times[index - 1].status);

  times.slice(index - 1, times.length).map((i) => {
    setTimeout(
      () => {
        setState(i.status);
        i.callback && i.callback();
      },
      getTimeoutTo(moment(i.time, "h:mm:ss a"))
    );
  });
};
