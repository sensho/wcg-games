import { sendMessage } from "./utils/telegram-utils";
import { handleDecimals, wcgContract } from "./utils/ethers-utils";

export const broadcastJackpotStats = async () => {
    const [jackpotEth, jackpotTokens] = await wcgContract.getJackpot();
    const [winnerEth, winnerTokens] =
      await wcgContract.jackpotBuyerShareAmount();
    const [buybackEth, buybackTokens] =
      await wcgContract.jackpotBuybackAmount();
    const jackpotHardLimit = await wcgContract.jackpotHardLimit();
    const [lastBuyer, lastBuyTime] = await wcgContract.getLastBuy();

    await sendMessage(
      `jackpotEth: ${handleDecimals(
        jackpotEth
      )}\njackpotTokens: ${handleDecimals(
        jackpotTokens
      )}\nwinnerEth: ${handleDecimals(
        winnerEth
      )}\nwinnerTokens: ${handleDecimals(
        winnerTokens
      )}\nbuybackEth: ${handleDecimals(
        buybackEth
      )}\nbuybackTokens: ${handleDecimals(
        buybackTokens
      )}\nlastBuyer: ${lastBuyer}\nlastBuyTime: ${handleDecimals(
        lastBuyTime,
        0
      )}\njackpotHardLimit: ${handleDecimals(jackpotHardLimit)}`
    );

    console.log("Broadcasted Jackpot stats");

};

export const initiateEventHandlers = async () => {
  wcgContract.on(
    "JackpotAwarded",
    (
      cashedOut,
      tokensOut,
      buyerShare,
      tokensToBuyer,
      toBuyback,
      tokensToBuyback
    ) => {
      sendMessage(`
        cashedOut:${handleDecimals(cashedOut)}\n
        tokensOut:${handleDecimals(tokensOut)}\n
        buyerShare:${handleDecimals(buyerShare)}\n
        tokensToBuyer:${handleDecimals(tokensToBuyer)}\n
        toBuyback:${handleDecimals(toBuyback)}\n
        tokensToBuyback:${handleDecimals(tokensToBuyback)}\n
        `);
    }
  );
};
