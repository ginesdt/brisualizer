import {NextApiRequest, NextApiResponse} from "next";
import {formatCoin, parseChain, tokenSorter} from "@/lib/api/utils";
import {fetchBridgeInfo} from "@/lib/bridge/db-manager";
import {BridgeInfo} from "@/lib/types";

export interface SuccessResponse {
  success: true,
  bridge: BridgeInfo
}

export interface ErrorResponse {
  success: false,
  error: string
}

export type ResponseData = SuccessResponse | ErrorResponse

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const chainId = parseChain(req);
  if (typeof chainId === "object") {
    res.status(400).json({success: false, error: chainId.error})
    return;
  }

  const bridgeInfo = await fetchBridgeInfo({chainId: chainId});
  bridgeInfo.tokens.sort(tokenSorter)
  res.status(200).json({
    success: true,
    bridge: bridgeInfo
  });
}
