import type {NextApiRequest, NextApiResponse} from 'next'
import {DepositCollector} from "@/lib/deposit/collector";
import {WithdrawCollector} from "@/lib/withdraw/collector";
import {BridgeInformationCollector} from "@/lib/bridge/collector";
import {bridgeConfigs} from "@/lib/constants";

export type ResponseData = [string, object][]

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {

  const updateInfo = await reloadAll();
  const entries: [string, object][] = Array.from(updateInfo.entries());

  res.status(200).json(entries)
}


async function reloadAll() {
  const updateInfo = new Map<string, object>();
  for (const bridgeConfig of bridgeConfigs) {
    const deposits = await new DepositCollector(bridgeConfig).updateDeposits();
    const withdraws = await new WithdrawCollector(bridgeConfig).updateWithdraws();
    const bridgeInfo = await new BridgeInformationCollector(bridgeConfig).updateBridgeInformation();
    updateInfo.set(bridgeConfig.l2.chainInfo.name, {...deposits, ...withdraws, ...bridgeInfo});
  }
  return updateInfo;
}