import {BridgeAddressInfo, BridgeInfo, TokenHoldingInfo} from "@/lib/types";
import {tokenInfoFromDb} from "@/lib/commons/db-utils";

export function bridgeInfoFromDb(bi: any) : BridgeInfo {
  return {
    chain: bi.chainId,
    chainName: bi.chainName,
    tokens: bi.tokens.map(tokenHoldingFromDb),
    addresses: bi.addresses.map(addressInfoFromDb),
    nativeCoinAmount: bi.nativeCoinAmount,
    nativeCoinPrice: bi.nativeCoinPrice}
}

export function addressInfoFromDb(ai: any) : BridgeAddressInfo {
  return {
    chain: ai.chain,
    address: ai.address,
    name: ai.name
  }
}

export function tokenHoldingFromDb(th: any) : TokenHoldingInfo {
  return {
    amount: th.amount,
    token: th.tokenInfo
  }
}
