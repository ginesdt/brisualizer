import {BridgeConfig, ChainInfo, DepositInfo, Token, TxHash, WithdrawInfo} from "@/lib/types";
import {fetchTokensPrice, getNativeCoinPrice} from "@/lib/commons/tx-info";
import {logger} from "../../logger";

export async function fillPriceDataL1(bridgeConfig: BridgeConfig, withdraws: Map<TxHash, WithdrawInfo|DepositInfo>): Promise<{tokens: Token[], pricesFilled: number}> {
  return await fillPriceDataForChain(bridgeConfig, bridgeConfig.l1.chainInfo, withdraws, "l1Token", "l1Price");
}
export async function fillPriceDataL2(bridgeConfig: BridgeConfig, withdraws: Map<TxHash, WithdrawInfo|DepositInfo>): Promise<{tokens: Token[], pricesFilled: number}> {
  return await fillPriceDataForChain(bridgeConfig, bridgeConfig.l2.chainInfo, withdraws, "l2Token", "l2Price");
}
async function fillPriceDataForChain(bridgeConfig: BridgeConfig, chainInfo: ChainInfo, withdrawsOrDeposits: Map<TxHash, WithdrawInfo|DepositInfo>, tokenProp: "l1Token"|"l2Token", priceProp: "l1Price"|"l2Price"): Promise<{tokens: Token[], pricesFilled: number}> {
  const tokensSet = new Set([...Array.from(withdrawsOrDeposits.values()).map((wi) => wi[tokenProp])]);

  tokensSet.delete(bridgeConfig.l2.addresses.ethTokenAddress);
  tokensSet.delete(bridgeConfig.l2.addresses.wrappedEthTokenAddress);

  const tokens = await fetchTokensPrice(chainInfo, Array.from(tokensSet));

  // logger.debug(`Cannot find price for: ${Array.from(tokens.values()).filter((t) => !t.actualPrice).map((t) => t.name)}`);

  const ethPrice = parseFloat(await getNativeCoinPrice(chainInfo));

  let pricesFilled = 0
  Array.from(withdrawsOrDeposits.values()).forEach((wi) => {
    const price = tokens.get(wi[tokenProp])?.actualPrice;
    if (price) {
      wi[priceProp] = parseFloat(price);
      pricesFilled++;
    }
    else if (wi[tokenProp] === bridgeConfig.l2.addresses.ethTokenAddress
      || wi[tokenProp] === bridgeConfig.l2.addresses.wrappedEthTokenAddress) {
      wi[priceProp] = ethPrice;
      pricesFilled++;
    }
  })

  return {tokens: Array.from(tokens.values()).map((token) => { return {
    chain: token.chainId,
    address: token.address,
    name: token.name,
    decimals: token.decimals,
    symbol: token.symbol,
    logoUrl: token.logoUrl,
    verified: token.isVerified,
    stable: token.isStable,
    price: token.actualPrice
  }}), pricesFilled};
}
