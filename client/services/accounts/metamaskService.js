export default class MetamaskService {

  constructor() {
  }

  getProvider(){
    return window.ethereum;
  }

  async getActiveAccount(){
    const accounts = await window.ethereum.send('eth_requestAccounts');
    return accounts.result[0];
  }

}
