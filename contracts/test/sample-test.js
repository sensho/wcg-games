// const { expect } = require("chai");
const hre = require("hardhat");
const dayjs = require("dayjs");

const { ethers } = hre;

describe("WifeChangingGameStakes", function () {
  it("Delpoying Greeter", async function () {
    const account = (await hre.ethers.getSigners())[0];

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

    const stakesParameters = [
      token.address,
      ethers.utils.parseUnits("1", 4),
      ethers.utils.parseUnits((dayjs().unix() + 1000 ** 2).toString(), 0),
      ethers.utils.parseUnits("1", 2),
      ethers.utils.parseUnits("1", 6),
      ethers.utils.parseUnits("1", 6),
      ethers.utils.parseUnits("1", 6),
    ];

    const stakes = await WifeChangingGameStakes.deploy(...stakesParameters);

    await stakes.deployed();

    console.log("WCG Skates deployed to:", stakes.address);
  });
});
