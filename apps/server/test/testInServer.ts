import dbService from "../services/db";

export const updateHolidaysInDB = async () => {
  const holidays2024 = [
    ["26-Jan-2024", "Republic Day"],
    ["08-Mar-2024", "Mahashivratri"],
    ["25-Mar-2024", "Holi"],
    ["29-Mar-2024", "Good Friday"],
    ["11-Apr-2024", "Id-Ul-Fitr (Ramadan Eid)"],
    ["17-Apr-2024", "Shri Ram Navmi"],
    ["01-May-2024", "Maharashtra Day"],
    ["17-Jun-2024", "Bakri Id"],
    ["17-Jul-2024", "Moharram"],
    ["15-Aug-2024", "Independence Day/Parsi New Year"],
    ["02-Oct-2024", "Mahatma Gandhi Jayanti"],
    ["01-Nov-2024", "Diwali Laxmi Pujan"],
    ["15-Nov-2024", "Gurunanak Jayanti"],
    ["20-Nov-2024", "Maharashtra Assembly Election 2024"],
    ["25-Dec-2024", "Christmas"],
  ];

  const holidays2025 = [
    ["26-Feb-2025", "Mahashivratri"],
    ["14-Mar-2025", "Holi"],
    ["31-Mar-2025", "Id-Ul-Fitr (Ramadan Eid)"],
    ["10-Apr-2025", "Shri Mahavir Jayanti"],
    ["14-Apr-2025", "Dr. Baba Saheb Ambedkar Jayanti"],
    ["18-Apr-2025", "Good Friday"],
    ["01-May-2025", "Maharashtra Day"],
    ["15-Aug-2025", "Independence Day"],
    ["27-Aug-2025", "Ganesh Chaturthi"],
    ["02-Oct-2025", "Mahatma Gandhi Jayanti/Dussehra"],
    ["21-Oct-2025", "Diwali Laxmi Pujan"],
    ["22-Oct-2025", "Diwali-Balipratipada"],
    ["05-Nov-2025", "Prakash Gurpurb Sri Guru Nanak Dev"],
    ["25-Dec-2025", "Christmas"],
  ];

  try {
    // Update the holidays in the states collection for the 'app' document
    await dbService.updateDocument("states", "app", {
      holidays: [...holidays2024, ...holidays2025],
    });
    console.log("Holidays updated successfully");
  } catch (error) {
    console.error("Error updating holidays:", error);
  }
};
