// utils/nicParser.js
// Sri Lankan NIC parser utility
module.exports = function parseNIC(nic) {
  // Example: 199012345678 or 901234567V
  let year, gender, dayText, genderCode;
  if (/^\d{12}$/.test(nic)) {
    year = parseInt(nic.slice(0, 4));
    dayText = nic.slice(4, 7);
  } else if (/^\d{9}[VXvx]$/.test(nic)) {
    year = 1900 + parseInt(nic.slice(0, 2));
    dayText = nic.slice(2, 5);
  } else {
    throw new Error("Invalid NIC format");
  }
  let day = parseInt(dayText, 10);
  gender = day > 500 ? "F" : "M";
  if (day > 500) day -= 500;
  // Approximate DOB (ignores leap years)
  const dob = new Date(year, 0, day);
  return { dob, gender };
};
