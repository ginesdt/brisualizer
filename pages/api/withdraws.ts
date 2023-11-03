import {NextApiRequest, NextApiResponse} from "next";
import {WithdrawInfo} from "@/lib/types";
import {countWithdraws, fetchWithdraws} from "@/lib/withdraw/db-manager";
import {parseRequest} from "@/lib/api/utils";

export interface SuccessResponse {
  success: true,
  withdraws: WithdrawInfo[],
  count: number
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
  const reqParams = parseRequest(req);
  if ("error" in reqParams) {
    res.status(400).json({success: false, error: reqParams.error})
    return;
  }
  let {chainId, limit, offset, address, coins, status} = reqParams;
  const count = await countWithdraws({chainId, address, coins, status});
  const withdraws = await fetchWithdraws({chainId, limit, offset, address, coins, status})
  res.status(200).json({
    success: true,
    withdraws: withdraws,
    count: count
  })
}
