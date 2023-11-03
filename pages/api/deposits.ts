import {NextApiRequest, NextApiResponse} from "next";
import {parseRequest} from "@/lib/api/utils";
import {DepositInfo} from "@/lib/types";
import {countDeposits, fetchDeposits} from "@/lib/deposit/db-manager";

export interface SuccessResponse {
  success: true,
  deposits: DepositInfo[],
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
  const count = await countDeposits({chainId, address, coins, status});
  const deposits = await fetchDeposits({chainId, limit, offset, address, coins, status})
  res.status(200).json({
    success: true,
    deposits: deposits,
    count: count
  })
}
