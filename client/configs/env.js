import * as reserveBuilt from './abis/Reserve.json';
import * as tokenBuilt from './abis/Token.json';
import * as exchangeBuilt from './abis/Exchange.json';

const EnvConfig = {

  RPC_ENDPOINT: 'http://127.0.0.1:8000',
  NETWORK_ID: 2020,
  TOKEN_ABI: tokenBuilt.abi,
  RESERVE_ABI: reserveBuilt.abi,
  EXCHANGE_CONTRACT_ABI: exchangeBuilt.abi,
  EXCHANGE_CONTRACT_ADDRESS: '0x75533fe8F77f9EEcB5f0349c7E8fF7c8D68766Ad',

  TOKENS: [
    {
      "name": 'Ether',
      "symbol": 'ETH',
      "decimals": 18
    },
    {
      "name": 'Coffee',
      "symbol": 'CFE',
      "reserveAddress": '0x6ae7EFFeeaF003005B7BB6C8ace63cfD3E27E7c1',
      "decimals": 4
    },
    {
      "name": 'Tea',
      "symbol": 'TEA',
      "reserveAddress": '0x1273132D72aa658E333b0c245E8B0bd167675d66',
      "decimals": 4
    },
  ]
  
};

export default EnvConfig;
