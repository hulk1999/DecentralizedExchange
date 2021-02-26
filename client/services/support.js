import EnvConfig from "../configs/env";
import BigNumber from "../libraries/bignumber";

export default class Supporter {

  constructor() {
  }

  static str2Token(str, tokenIndex, currentBalance){

    if (!str.match(/^\d*(\.\d+)?$/)) return '';  // not float
    if (str.indexOf('.') != -1 && str.length-str.indexOf('.')-1 > EnvConfig.TOKENS[tokenIndex].decimals) return '';  // too many decimals

    const decs = str.indexOf('.') == -1 ? 0 : str.length-str.indexOf('.')-1;
    var token = str.replace('.', '');
    for (var i = 0; i < EnvConfig.TOKENS[tokenIndex].decimals-decs; i++) token += '0';

    if (parseInt(token) > parseInt(currentBalance)) return '';  // exceed current balance

    return token;

  }

  static token2Str(token, tokenIndex){
    const length = token.length;
    for (var i = 0; i < EnvConfig.TOKENS[tokenIndex].decimals-length+1; i++) token = '0' + token;
    const position = token.length - EnvConfig.TOKENS[tokenIndex].decimals;
    return token.slice(0, position) + "." + token.slice(position);
  }

  static rawRate2DestAmount(rawRate, srcTokenIndex, destTokenIndex, srcAmount){
    if (rawRate[0] == 0 || rawRate[1] == 0) return 0;
    const srcRate = new BigNumber(rawRate[0]);
    const desRate = new BigNumber(rawRate[1]);
    const amount = new BigNumber(srcAmount);
    const res = desRate.multipliedBy(amount).dividedToIntegerBy(srcRate).toString();
    return this.token2Str(res, destTokenIndex);
  }

}
