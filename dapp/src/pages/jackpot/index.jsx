import dayjs from "dayjs";
import { ethers } from "ethers";
import React from "react";
import LoadingComponent from "../../components/LoadingComponent";
import tokenContext from "../../utils/contexts/useToken";
import { removeDecimalsToString } from "../../utils/ethers";

function JackpotScreen() {
  const { token } = React.useContext(tokenContext);
  const [isLoading, setIsLoading] = React.useState(true);
  const [jackpotData, setJackpotData] = React.useState({});

  React.useEffect(() => {
    (async () => {
      const [jackpotEth, jackpotTokens] = await token.getJackpot();
      const [winnerEth, winnerTokens] = await token.jackpotBuyerShareAmount();
      const [buybackEth, buybackTokens] = await token.jackpotBuybackAmount();
      const jackpotHardLimit = await token.jackpotHardLimit();
      const [lastBuyer, lastBuyTime] = await token.getLastBuy();

      console.log({ lastBuyTime: lastBuyTime });

      setJackpotData({
        jackpotEth,
        jackpotTokens,
        winnerEth,
        winnerTokens,
        buybackEth,
        buybackTokens,
        lastBuyer,
        lastBuyTime,
        jackpotHardLimit,
      });

      setIsLoading(false);
    })();
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <section className="flex flex-col items-stretch space-y-2 ">
        <div className="flex flex-row space-x-3 ">
          <h1 className="flex-1 text-center">JACKPOT STATS</h1>
        </div>
        <div className="h-full flex flex-col border-4 rounded-sm p-3">
          {isLoading ? (
            <LoadingComponent />
          ) : (
            <div className="flex flex-col items-stretch space-y-4">
              <div className=" flex-1 text-center">Amount</div>
              <div className="flex flex-1 flex-row justify-center space-x-4">
                <div className="flex flex-col ">
                  <div className="text-center">ETH</div>
                  <div className="text-center">
                    {removeDecimalsToString(jackpotData.jackpotEth)}
                  </div>
                </div>
                <div className="flex flex-col ">
                  <div className="text-center">WCG</div>
                  <div className="text-center">
                    {removeDecimalsToString(jackpotData.jackpotTokens)}
                  </div>
                </div>
              </div>
              <div className=" flex-1 text-center">
                Time Left:{" "}
                {jackpotData.lastBuyTime.lte(ethers.BigNumber.from(0))
                  ? "No Purchases Yet"
                  : dayjs
                      .unix(removeDecimalsToString(jackpotData.lastBuyTime, 0))
                      .add(10, "minutes")
                      .fromNow()}
              </div>
              <div className=" flex-1 text-center">
                Amount to Big Bang :{" "}
                {removeDecimalsToString(
                  jackpotData.jackpotHardLimit.sub(jackpotData.jackpotEth)
                )}
              </div>
              <div className=" flex-1 text-center">Winner's Share</div>
              <div className="flex flex-1 flex-row justify-center space-x-4">
                <div className="flex flex-col ">
                  <div className="text-center">ETH</div>
                  <div className="text-center">
                    {removeDecimalsToString(jackpotData.winnerEth)}
                  </div>
                </div>
                <div className="flex flex-col ">
                  <div className="text-center">WCG</div>
                  <div className="text-center">
                    {removeDecimalsToString(jackpotData.winnerTokens)}
                  </div>
                </div>
              </div>
              <div className=" flex-1 text-center">BuyBack's Share</div>
              <div className="flex flex-1 flex-row justify-center space-x-4">
                <div className="flex flex-col ">
                  <div className="text-center">ETH</div>
                  <div className="text-center">
                    {removeDecimalsToString(jackpotData.buybackEth)}
                  </div>
                </div>
                <div className="flex flex-col ">
                  <div className="text-center">WCG</div>
                  <div className="text-center">
                    {removeDecimalsToString(jackpotData.buybackTokens)}
                  </div>
                </div>
              </div>
              <div className=" flex-1 text-center">Last Buy</div>
              <div className=" flex-1 text-center">{jackpotData.lastBuyer}</div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default JackpotScreen;
