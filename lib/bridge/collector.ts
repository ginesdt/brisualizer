import {storeTokensHolding, updateNativeCoin} from "@/lib/bridge/db-manager";
import {fetchNativeCoin, fetchTokens} from "@/lib/commons/tx-info";
import {BridgeConfig} from "@/lib/types";


interface IBridgeInformationCollector {
  updateBridgeInformation: () => Promise<{ nativeCoin: string | undefined; tokenHoldings: number }>
}

export class BridgeInformationCollector implements IBridgeInformationCollector {
  private readonly bridgeConfig: BridgeConfig;

  constructor(bridgeConfig: BridgeConfig) {
    this.bridgeConfig = bridgeConfig;
  }
  public async updateBridgeInformation(): Promise<{ nativeCoin: string | undefined; tokenHoldings: number }> {
    const coinsResponse = await fetchNativeCoin(this.bridgeConfig.l1.chainInfo, this.bridgeConfig.l1.addresses.portalAddress);
    if (coinsResponse) {
      updateNativeCoin(coinsResponse, this.bridgeConfig.l2.chainInfo.chainId);
    }
    const tokenHoldings = await fetchTokens(this.bridgeConfig.l1.chainInfo, this.bridgeConfig.l1.addresses.bridgeAddress);
    storeTokensHolding(tokenHoldings, this.bridgeConfig.l2.chainInfo.chainId);

    return {tokenHoldings: tokenHoldings.length, nativeCoin: coinsResponse?.amount}
  }
}

