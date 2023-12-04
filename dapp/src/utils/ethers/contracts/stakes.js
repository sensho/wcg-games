import { ethers } from "ethers";
import abi from "../../../artifacts/WifeChangingGameStakes.json";
import { ethers_signer } from "..";

class StakingContract {
  constructor(address) {
    this.contractAddress = address;
    this.contract = new ethers.Contract(address, abi.abi, ethers_signer);
  }

  async maturity() {
    return await this.contract.maturity();
  }

  async interestRate() {
    return await this.contract.interestRate();
  }

  async penaltyPct() {
    return await this.contract.penaltyPct();
  }

  async minStakingAmount() {
    return await this.contract.minStakingAmount();
  }
  async maxStakingAmount() {
    return await this.contract.maxStakingAmount();
  }
  async maxStakingUsers() {
    return await this.contract.maxStakingUsers();
  }

  async stakingEnabled() {
    return await this.contract.stakingEnabled();
  }

  async totalStaked() {
    return await this.contract.totalStaked();
  }

  async activeStakers() {
    return await this.contract.activeStakers();
  }

  async activeStakes(address) {
    return await this.contract.activeStakes(address);
  }

  async stake(amount) {
    return await this.contract.stake(amount);
  }
}

export default StakingContract;
