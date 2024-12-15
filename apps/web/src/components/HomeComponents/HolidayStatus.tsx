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
    return "No";
  };

  return (
    <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-4">
      <h2 className="text-foreground text-lg">
        Market Holiday Today{" - "}
        <span className="text-red-800 dark:text-red-200 text-xl">
          {getText()}
        </span>
      </h2>
    </div>
  );
}
