import { ethers } from "ethers";
import { ethers_signer } from "..";
import contract_interface from "../../../artifacts/WifeChangingGame.json";

class TokenContract {
  constructor(
    address = import.meta.env.VITE_WCG_TOKEN_ADDRESS,
    abi = contract_interface.abi
  ) {
    this.token_address = address;
    this.abi = abi;

    this.contract = new ethers.Contract(address, abi, ethers_signer);
  }

  async approve(address, amount) {
    return await this.contract.approve(address, amount);
  }

  async allowance(to_address, from_address) {
    return await this.contract.allowance(to_address, from_address);
  }

  async name() {
    return await this.contract.name();
  }

  async symbol() {
    return await this.contract.symbol();
  }

  async getJackpot() {
    return await this.contract.getJackpot();
  }

  async jackpotBuyerShareAmount() {
    return await this.contract.jackpotBuyerShareAmount();
  }

  async jackpotBuybackAmount() {
    return await this.contract.jackpotBuybackAmount();
  }

  async getLastBuy() {
    return await this.contract.getLastBuy();
  }

  async uniswapV2Pair() {
    return await this.contract.uniswapV2Pair();
  }

  async uniswapV2Router() {
    return await this.contract.uniswapV2Router();
  }

  async jackpotHardLimit() {
    return await this.contract.jackpotHardLimit();
  }

  async getLastAwarded() {
    return await this.contract.getLastAwarded();
  }

  async getLastBigBang() {
    return await this.contract.getLastBigBang();
  }

  async getMyBalance() {
    return await this.contract.balanceOf(await ethers_signer.getAddress());
  }

  async getBalance(address) {
    return await this.contract.balanceOf(address);
  }
}

export default TokenContract;
