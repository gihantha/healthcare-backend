// Dummy notification utility (email/SMS)
module.exports = async function notify({ to, type, message }) {
  // Integrate with real email/SMS provider as needed
  console.log(`[NOTIFY] To: ${to}, Type: ${type}, Message: ${message}`);
};
