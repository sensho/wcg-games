import dotenv from "dotenv";
dotenv.config();

import { broadcastJackpotStats } from "./src/jackpot-stats";

setInterval(() => {
  try {
    broadcastJackpotStats();
  } catch (err) {
    console.log("Broadcasting Jackpot stats failed");
  }
}, 60 * 1000);
