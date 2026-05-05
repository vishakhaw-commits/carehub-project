const axios = require("axios");

const API_KEY = "6473EL8Y528P1EK3";

let emergencyMode = false;   // Emergency

setInterval(async () => {

  let heartRate;
  let oxygen;
  let temperature;

  if (emergencyMode) {
    heartRate = 145;
    oxygen = 82;
    temperature = 39.8;
  } else {
    heartRate = Math.floor(Math.random() * 30) + 70;
    oxygen = Math.floor(Math.random() * 5) + 95;
    temperature = (Math.random() * 1 + 36).toFixed(1);
  }

  try {

    await axios.get(
      `https://api.thingspeak.com/update?api_key=${API_KEY}&field1=${heartRate}&field2=${oxygen}&field3=${temperature}`
    );

    console.log("Vitals sent:", heartRate, oxygen, temperature);

  } catch (err) {
    console.error(err.message);
  }

}, 5000);