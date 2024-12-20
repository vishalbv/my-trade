import moment from "moment";
import { RootState } from "../../store/store";
import { useSelector } from "react-redux";

export function HolidayStatus() {
  const holidays = useSelector(
    (state: RootState) => state.states.app?.holidays || []
  );

  const isHoliday = holidays.find(([holiday]: [string, string]) => {
    const [day, month, year] = holiday.split("-");
    const holidayDate = new Date(`${year}-${month}-${day}`);
    return holidayDate.toDateString() === new Date().toDateString();
  });

  const getText = () => {
    if (moment().day() === 0) {
      return "Sunday";
    }
    if (moment().day() === 6) {
      return "Saturday";
    }
    if (isHoliday) {
      return isHoliday[1];
    }
    return null;
  };

  if (!getText()) return null;

  return (
    <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 rounded-xl p-3 inline-flex items-center gap-2 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
        <h2 className="text-orange-900 dark:text-orange-100 text-sm font-medium">
          Market Holiday Today
          <span className="mx-2">•</span>
          <span className="text-orange-700 dark:text-orange-200 font-semibold">
            {getText()}
          </span>
        </h2>
      </div>
    </div>
  );
}
