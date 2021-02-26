import Web3 from "web3";
import EnvConfig from "../configs/env";

export default class Web3Service {

  constructor(provider) {
    this.web3 = new Web3(provider);
  }

  setAccount(address){
    this.account = address;
  }

  async initContracts(){

    this.reserves = [];
    this.reserves[0] = new this.web3.eth.Contract(EnvConfig.RESERVE_ABI, EnvConfig.TOKENS[1].reserveAddress);
    this.reserves[1] = new this.web3.eth.Contract(EnvConfig.RESERVE_ABI, EnvConfig.TOKENS[2].reserveAddress);
    
    this.tokens = [];
    this.tokens[0] = new this.web3.eth.Contract(EnvConfig.TOKEN_ABI, await this.reserves[0].methods.token().call());
    this.tokens[1] = new this.web3.eth.Contract(EnvConfig.TOKEN_ABI, await this.reserves[1].methods.token().call());

    this.exchangeContract = new this.web3.eth.Contract(EnvConfig.EXCHANGE_CONTRACT_ABI, EnvConfig.EXCHANGE_CONTRACT_ADDRESS);

  }

  async getNetworkId(){
    return await this.web3.eth.net.getId();
  }

  isAddressValid(address){
    return this.web3.utils.isAddress(address);
  }

  async getExchangeRate(srcTokenIndex, destTokenIndex, amount) {
    const rate = await this.exchangeContract.methods.getExchangeRate(srcTokenIndex, destTokenIndex, amount).call();
    return rate;
  }

  async getEthBalance(userAddress){
    return await this.web3.eth.getBalance(userAddress);
  }

  async getTokenBalance(userAddress, tokenIndex) {
    return await this.tokens[tokenIndex-1].methods.balanceOf(userAddress).call();
  }

  async exchange(srcTokenIndex, destTokenIndex, amount, exchangeRate){
    if (srcTokenIndex != 0){  // src token is not ETH
      await this.tokens[srcTokenIndex-1].methods
        .approve(EnvConfig.EXCHANGE_CONTRACT_ADDRESS, amount)
        .send({from: this.account});
    }
    return await this.exchangeContract.methods
      .exchange(srcTokenIndex, destTokenIndex, amount, exchangeRate)
      .send({
        from: this.account,
        to: EnvConfig.EXCHANGE_CONTRACT_ADDRESS,
        value: srcTokenIndex == 0 ? amount : 0,
        gas: 1000000
      });
  }

  async transfer(tokenIndex, amount, receivingAddress){
    if (tokenIndex == 0){  // transfer ETH
      return await this.web3.eth.sendTransaction({
        from: this.account,
        to: receivingAddress,
        value: amount
      });
    }
    return await this.tokens[tokenIndex-1].methods  // transfer token
      .transfer(receivingAddress, amount)
      .send({from: this.account});
  }

}