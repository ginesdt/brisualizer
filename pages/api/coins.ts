import {NextApiRequest, NextApiResponse} from "next";
import {formatCoin, parseChain, tokenSorter} from "@/lib/api/utils";
import {Token} from "@/lib/types";
import {fetchTokensInfos} from "@/lib/commons/db-manager";
import {fetchBridgeInfo} from "@/lib/bridge/db-manager";

export interface SuccessResponse {
  success: true,
  tokens: Token[]
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

  res.status(200).json({
    success: true,
    tokens: bridgeInfo.tokens.sort(tokenSorter).map(t => t.token)
  });
}
