import dayjs from "dayjs";
import React, { useEffect } from "react";
import LoadingComponent from "../../components/LoadingComponent";
import tokenContext from "../../utils/contexts/useToken";
import walletContext from "../../utils/contexts/useWallet";
import {
  addDecimals,
  removeDecimalsToNumber,
  removeDecimalsToString,
} from "../../utils/ethers";
import StakingContract from "../../utils/ethers/contracts/stakes";

const STAKING_POOLS = [
  {
    poolName: "POOL ICHI",
    poolAddress: import.meta.env.VITE_WCG_POOL_ICHI,
  },
  {
    poolName: "POOL NI",
    poolAddress: import.meta.env.VITE_WCG_POOL_NI,
  },
];

console.log({ STAKING_POOLS });

function StakeScreen() {
  const [activePool, setActivePool] = React.useState(0);
  const { token, tokenBalance } = React.useContext(tokenContext);
  const { activeWallet } = React.useContext(walletContext);
  const [userTokenAllowance, setUserTokenAllowance] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activePoolContract, setActivePoolContract] = React.useState(
    new StakingContract(STAKING_POOLS[activePool].poolAddress)
  );
  const [countDown, setCountDown] = React.useState();
  const [poolData, setPoolData] = React.useState({
    isEnabled: false,
    expiry: "",
    apr: "",
    penalty: "",
    capacity: "",
    maxStakers: "",
    minStakesPerUser: "",
    maxStakesPerUser: "",
    activeStakers: "",
    totalStaked: "",
    pendingGains: "",
    balance: "",
  });
  const [stakeInput, setStakeInput] = React.useState(0);

  React.useEffect(() => {
    (async () => {
      setIsLoading(true);

      const pool = new StakingContract(STAKING_POOLS[activePool].poolAddress);

      setActivePoolContract(pool);

      console.log(await token.uniswapV2Router());

      const isEnabled = await pool.stakingEnabled();
      const expiry = dayjs.unix((await pool.maturity()).toString());
      const apr = await pool.interestRate();
      const penalty = await pool.penaltyPct();
      const maxStakers = (await pool.maxStakingUsers()).toString();
      const minStakesPerUser = removeDecimalsToNumber(
        await pool.minStakingAmount()
      );
      const maxStakesPerUser = removeDecimalsToNumber(
        await pool.maxStakingAmount()
      );
      const capacity = maxStakers * maxStakesPerUser;
      const activeStakers = (await pool.activeStakers()).toString();
      const totalStaked = removeDecimalsToString(await pool.totalStaked());
      const pendingGains = "";
      const balance = "";

      setUserTokenAllowance(
        removeDecimalsToString(
          await token.allowance(
            activeWallet,
            activePoolContract.contractAddress
          )
        )
      );
      setCountDown(dayjs(expiry).fromNow());

      setPoolData({
        isEnabled,
        expiry,
        apr,
        penalty,
        capacity,
        maxStakers,
        minStakesPerUser,
        maxStakesPerUser,
        activeStakers,
        totalStaked,
        pendingGains,
        balance,
      });
      setIsLoading(false);
    })();
  }, [activePool]);

  useEffect(() => {
    let countdown;

    if (poolData.expiry) {
      countdown = setInterval(() => {
        setCountDown(dayjs(poolData.expiry).fromNow());
      }, 1000);
    }

    if (countdown) return () => clearInterval(countdown);
  }, [poolData]);

  const isStakeDisabled = () =>
    !poolData.isEnabled ||
    stakeInput <= 0 ||
    stakeInput < poolData.minStakesPerUser ||
    stakeInput > poolData.maxStakesPerUser;

  const handleApprove = async () => {
    const tx = await token.approve(
      activePoolContract.contractAddress,
      addDecimals(stakeInput)
    );

    await tx.wait();

    setUserTokenAllowance(
      await token.allowance(activeWallet, activePoolContract.contractAddress)
    );
  };

  const handleStake = async () => {
    const tx = await activePoolContract.stake(addDecimals(stakeInput));

    await tx.wait();

    window.location.reload();
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <section className="flex flex-col w-96 h-96 items-stretch space-y-2 ">
        <div className="flex flex-row space-x-3 ">
          {STAKING_POOLS.map((pool, index) => (
            <button
              onClick={() => setActivePool(index)}
              className={`btn rounded-md flex-1  text-xs ${
                activePool === index ? "bg-green-400" : "border-2"
              }`}
              key={pool.poolName}
            >
              {pool.poolName}
            </button>
          ))}
        </div>
        <div className="h-full flex flex-col border-4 rounded-sm p-3">
          {isLoading ? (
            <LoadingComponent />
          ) : (
            <>
              <div className="flex-1">Expires {countDown}</div>
              <div className="flex-1 flex flex-row space-x-2">
                <div>{poolData.apr}% APR</div>
                <div>{poolData.penalty}% Withdraw Penalty</div>
              </div>
              <div className="flex-1 flex flex-row space-x-2">
                <div>Pool Capacity: {poolData.capacity}</div>
                <div>Max Stakers: {poolData.maxStakers}</div>
              </div>
              <div className="flex-1 flex flex-row space-x-2">
                <div>Min Stakes/User: {poolData.minStakesPerUser}</div>
                <div>Max Stakes/User: {poolData.maxStakesPerUser}</div>
              </div>
              <div className="flex-1 flex flex-row space-x-2">
                <div>Active Stakers: {poolData.activeStakers}</div>
                <div>Total Staked: {poolData.totalStaked} </div>
              </div>
              <div className="text-xs">Balance : {tokenBalance} WCG</div>

              <div className="flex-1 flex flex-row justify-between items-center">
                <div>$WCG</div>
                <div className="border-2 ">
                  <input
                    className="text-right w-16"
                    type="number"
                    onChange={(e) => setStakeInput(e.target.value)}
                    value={stakeInput}
                  />
                </div>
              </div>

              <button
                onClick={
                  userTokenAllowance >= stakeInput ? handleStake : handleApprove
                }
                className={`flex-1 rounded-md ${
                  isStakeDisabled() ? "bg-gray-700 text-white" : "bg-green-500"
                }`}
                disabled={isStakeDisabled()}
              >
                {!poolData.isEnabled
                  ? "Staking pool is not enabled"
                  : stakeInput > 0
                  ? `${
                      userTokenAllowance >= stakeInput ? "Stake" : "Approve"
                    } ${stakeInput} WCG Tokens`
                  : "Enter Amount to Stake"}
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default StakeScreen;
