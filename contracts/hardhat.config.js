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
  // defaultNetwork: "rinkeby",
  defaultNetwork: "ropsten",
  networks: {
    ganache: {
      url: "HTTP://127.0.0.1:8545",
      accounts: {
        mnemonic:
          process.env.MNEMONIC,
      },
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: {
        mnemonic:
          process.env.MNEMONIC,
      },
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: {
        mnemonic:
          process.env.MNEMONIC,
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

// Rinkeby

// Deploying Contracts from 0x840589897DcDb1Cc8773C616Bf22A90E53E961F3, Balance : 397641159478202239
// WCG Token deployed to: 0xa7063958Cb21d827780B2dfE2fC3F0CF58029A38
// WCG Skates deployed to: 0x800A4bff7fDba82b3821c1D32632Acf18Be243ec

// Local Hardhat

// Deploying Contracts from 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266, Balance : 10000000000000000000000
// WCG Token deployed to: 0x02df3a3F960393F5B349E40A599FEda91a7cc1A7
// WCG Skates deployed to: 0x821f3361D454cc98b7555221A06Be563a7E2E0A6

// Local Ganache

// Deploying Contracts from 0x840589897DcDb1Cc8773C616Bf22A90E53E961F3, Balance : 100000000000000000000
// WCG Token deployed to: 0xc525595EE268D569d7Ae042A28947bB11cbEE486
// Pool Ichi deployed to: 0xA6a16973861BeC945BEeEA0B1Ff4354FFF86f1A8
// Pool Ni deployed to: 0x95AdF600a087641FE91C42037804a62CCc07aed0

// Ropsten

// Deploying Contracts from 0x840589897DcDb1Cc8773C616Bf22A90E53E961F3, Balance : 1032465256341505162
// WCG Token deployed to: 0xB0304571De46E66D7Ae44566Fa135A6E3E543B94
// Pool Ichi deployed to: 0x694398aAB7021A256b016bd3B796403F9cc8C3aF
// Pool Ni deployed to: 0x62e64bA193d41A27d872365201c12e570B4DCaD4
