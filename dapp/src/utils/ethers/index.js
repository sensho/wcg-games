import { ethers } from "ethers";

export const removeDecimalsToNumber = (num, decimals = 18) => {
  const divisor = ethers.utils.parseUnits("1", decimals);

  return num.div(divisor).toNumber();
};

export const removeDecimalsToString = (num, decimals = 18) => {
  const divisor = ethers.utils.parseUnits("1", decimals);

  return num.div(divisor).toString();
};

export const addDecimals = (num, decimals = 18) => {
  return ethers.utils.parseUnits(num.toString(), decimals);
};

export const ethers_provider = new ethers.providers.Web3Provider(
  window.ethereum,
  "any"
);

export const ethers_signer = ethers_provider.getSigner();
