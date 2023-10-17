import { ethers } from "ethers";
import stakingAbi from "../../staking-abi.json";
import wcgAbi from "../../wcg-abi.json";

export const ethers_provider = new ethers.getDefaultProvider("ropsten");

const account = ethers.utils.HDNode.fromMnemonic(
  process.env.MNEMONIC
).derivePath(`m/44'/60'/0'/0/1`);

export const ethers_signer = new ethers.Wallet(account, ethers_provider);

(async () => {
  console.log(`Using account ${await ethers_signer.getAddress()}`);
})();

export const wcgContract = new ethers.Contract(
  "0xB0304571De46E66D7Ae44566Fa135A6E3E543B94",
  wcgAbi.abi,
  ethers_signer
);

export const wcgStaking = new ethers.Contract(
  "0x694398aAB7021A256b016bd3B796403F9cc8C3aF",
  stakingAbi.abi,
  ethers_signer
);

export const handleDecimals = (num, dec = 18) => {
  const decimals = ethers.utils.parseUnits("1", dec);

  return num.div(decimals);
};
