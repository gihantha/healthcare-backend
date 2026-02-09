// utils/notifier.js
const axios = require("axios");
let twilioClient = null;

// Initialize Twilio if selected
if (process.env.SMS_PLATFORM === "TWILIO") {
  const twilio = require("twilio");
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

module.exports = async function notify({ to, type, message }) {
  if (type !== "sms") return;

  const platform = process.env.SMS_PLATFORM;

  try {
    // ================= TWILIO =================
    if (platform === "TWILIO") {
      if (!twilioClient) throw new Error("Twilio client not initialized");

      await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to,
      });

      console.log(`[SMS][TWILIO] Sent to ${to}`);
    }

    // ================= TEXTBELT =================
    else if (platform === "TEXTBELT") {
      const response = await axios.post("https://textbelt.com/text", {
        phone: to,
        message,
        key: "textbelt", // free dev key
      });

      console.log("[SMS][TEXTBELT]", response.data);

      if (!response.data.success) {
        throw new Error(response.data.error || "Textbelt failed");
      }
    }

    // ================= TEXTBEE =================
    else if (platform === "TEXTBEE") {
      // Make sure your phone IP is correct in .env
      const TEXTBEE_URL =
        process.env.TEXTBEE_URL || "http://192.168.1.10:3000/send-sms";

      const response = await axios.post(TEXTBEE_URL, {
        to,
        message,
      });

      console.log("[SMS][TEXTBEE]", response.data);

      if (!response.data.success) {
        throw new Error(response.data.error || "Textbee failed");
      }
    }

    // ================= MOCK / FALLBACK =================
    else {
      console.log(`[SMS][MOCK] ${to}: ${message}`);
    }
  } catch (err) {
    console.error(`[SMS ERROR][${platform}]`, err.message);
  }
};
