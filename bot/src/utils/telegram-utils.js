import axios from "axios";
import { baseUrl } from "../urls";

let last_update_id = 0;

export const sendMessage = async (text) => {
  return await axios.post(
    `${baseUrl}/sendMessage`,
    {
      chat_id: process.env.GROUP_CHAT_ID,
      text: text,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};

export const getMe = async () => {
  try {
    const response = await axios.get(`${baseUrl}/getMe`);
    // console.log(response.data);
  } catch (err) {
    console.log(err);
  }
};

export const getUpdates = async () => {
  try {
    const url = new URL(`${baseUrl}/getUpdates`);
    url.searchParams.set("offset", last_update_id + 1);
    url.searchParams.set("allowed_updates", ["message"]);

    const response = await axios.get(url.toString());

    last_update_id =
      response.data.result[response.data.result.length - 1].update_id;

    console.log(JSON.stringify(response.data.result));
  } catch (err) {
    console.log(err);
  }
};
