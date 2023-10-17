// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const dayjs = require("dayjs");
const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy

  const account = (await hre.ethers.getSigners())[0];
  let tx;

  console.log(
    `Deploying Contracts from ${
      account.address
    }, Balance : ${await account.getBalance()}`
  );

  const WifeChangingGameToken = await hre.ethers.getContractFactory(
    "WifeChangingGame"
  );

  const WifeChangingGameStakes = await hre.ethers.getContractFactory(
    "WifeChangingGameStakes"
  );

  const tokenParameters = [account.address];

  const token = await WifeChangingGameToken.deploy(...tokenParameters);

  await token.deployed();

  console.log("WCG Token deployed to:", token.address);

  tx = await token.enableTrading();

  await tx.wait();

  let stakesParameters = [
    token.address,
    ethers.utils.parseUnits("4", 2),
    ethers.utils.parseUnits((dayjs().unix() + 1000 ** 2).toString(), 0),
    ethers.utils.parseUnits("10", 0),
    ethers.utils.parseUnits("10000", 18),
    ethers.utils.parseUnits("100000", 18),
    ethers.utils.parseUnits("1", 3),
  ];

  let stakes = await WifeChangingGameStakes.deploy(...stakesParameters);

  await stakes.deployed();

  console.log("Pool Ichi deployed to:", stakes.address);

  tx = await token.approve(
    stakes.address,
    ethers.utils.parseUnits("100000000000000000", 18)
  );

  await tx.wait();

  tx = await stakes.enableStaking();

  await tx.wait();

  stakesParameters = [
    token.address,
    ethers.utils.parseUnits("5", 2),
    ethers.utils.parseUnits((dayjs().unix() + 10000 ** 2).toString(), 0),
    ethers.utils.parseUnits("100", 0),
    ethers.utils.parseUnits("20000", 18),
    ethers.utils.parseUnits("300000", 18),
    ethers.utils.parseUnits("2", 3),
  ];

  stakes = await WifeChangingGameStakes.deploy(...stakesParameters);

  await stakes.deployed();

  console.log("Pool Ni deployed to:", stakes.address);

  tx = await token.approve(
    stakes.address,
    ethers.utils.parseUnits("100000000000000000", 18)
  );

  await tx.wait();

  tx = await stakes.enableStaking();

  await tx.wait();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
