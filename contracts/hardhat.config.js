const dayjs = require("dayjs");
const { tokenAbi } = require("./token-abi");
const { uniswapAbi } = require("./uniswap-abi");

require("dotenv").config();

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(
      `Balance of ${account.address} : ${await account.getBalance()}`
    );
  }
});

task(
  "addLiquidity",
  "Adds Initial Liquidity to the uniswap pool",
  async (taskArgs, hre) => {
    const account = (await hre.ethers.getSigners())[0];

    const token = new hre.ethers.Contract(
      "0xB0304571De46E66D7Ae44566Fa135A6E3E543B94",
      tokenAbi,
      account
    );

    const uniswapV2Router = new hre.ethers.Contract(
      "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
      uniswapAbi,
      account
    );

    const tokenAmount = hre.ethers.utils.parseUnits("50000", 18);
    const ethAmount = hre.ethers.utils.parseUnits("1", 18);

    let tx = await token.approve(
      "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
      tokenAmount
    );

    await tx.wait();

    console.log("Amount Approved");

    tx = await uniswapV2Router.addLiquidityETH(
      token.address,
      tokenAmount,
      tokenAmount,
      ethAmount,
      account.address,
      dayjs().unix() + 100,
      {
        value: ethAmount,
      }
    );

    await tx.wait();
  }
);

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.13",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  defaultNetwork: "sepolia",
  networks: {
    ganache: {
      url: "HTTP://127.0.0.1:8545",
      accounts: {
        mnemonic: process.env.MNEMONIC,
      },
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: {
        mnemonic: process.env.MNEMONIC,
      },
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: {
        mnemonic: process.env.MNEMONIC,
      },
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: {
        mnemonic: process.env.MNEMONIC,
      },
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: {
        mnemonic: process.env.MNEMONIC,
      },
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

// SEPOLIA DEPLOYMENT

// Deploying Contracts from 0xCF5B123Ea094A776dD20fA07c3Ea433B54323CBd, Balance : 2559459863493777314
// WCG Token deployed to: 0xc901A057a9037c3768090CEF25Dbbc9f06A23d32
// Pool Ichi deployed to: 0xD49d5d18C160711Ac725112c62457338C37c30F4
// Pool Ni deployed to: 0x4b2aE598B7423a3F581D6E7DcAa7BEE30c7acfD4
