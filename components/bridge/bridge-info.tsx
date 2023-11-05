import useSWR from "swr";
import {
  fetcher,
  formatCoin,
  addThousandsSeparator, txLink, addressLink
} from "@/lib/api/utils";
import {AUTO_REFRESH_MS} from "@/lib/constants";
import {ResponseData} from "@/pages/api/bridgeinfo";
import Link from "next/link";
import {TokenInfo} from "@/components/bridge/token-info";
import Image from "next/image";



export function BridgeInfo({chainId, autoRefresh}: {chainId: number, autoRefresh: boolean}) {
  const {data, error, isLoading} = useSWR<ResponseData>(
    `/api/bridgeinfo?chainId=${chainId}`,
    fetcher,
    { refreshInterval: autoRefresh? AUTO_REFRESH_MS : undefined }
  );
  const isError = (error || !data?.success);


  if (isLoading)
    return <Loading />
  if (isError)
    return <Error />

  const tokenSummary = data.bridge.tokens.reduce((aggr, t) => {
    return {tokens: aggr.tokens + (t.token.price && t.amount? 1 : 0), totalAmount: aggr.totalAmount + (t.token.price && t.amount? (
          parseFloat(t.token.price)
          * parseFloat(formatCoin(t.amount, t.token.decimals, null))) : 0)}
  }, {tokens: 0, totalAmount: 0})

  return <div className="w-full justify-center pb-5">
    <div className="w-[1300px] m-auto">
      <h1 className="text-2xl pb-2">{data.bridge.chainName} Bridge</h1>
      <div className="flex grid grid-cols-2">
        <div>
          <h2 className="font-medium">ETH Balance</h2>
          <div className="flex space-x-2">
            <Image width="24"  height="24" src={"https://assets.coingecko.com/coins/images/279/standard/ethereum.png"} alt="ethereum logo" />
            <div>
              {addThousandsSeparator(formatCoin(data.bridge.nativeCoinAmount))}
            </div>
            <div>
              (${addThousandsSeparator((
                  parseFloat(data.bridge.nativeCoinPrice)
                 * parseFloat(formatCoin(data.bridge.nativeCoinAmount))).toFixed(2))} | @ {parseFloat(data.bridge.nativeCoinPrice).toFixed(2)}/ETH)
            </div>
          </div>
          <div>
            <h2 className="font-medium pt-2">
              Bridge Contracts
            </h2>
            <ul className="list-disc pl-5">
              {data.bridge.addresses.map(a => {return <li key={a.address}>
                <Link className="hover:font-medium" target="_blank" href={addressLink(a.chain, a.address)}>{a.name}</Link>
              </li>})}
            </ul>
          </div>
        </div>
        <div>
          <h2 className="font-medium">Token Balance</h2>
          {tokenSummary.tokens} tokens (${addThousandsSeparator(tokenSummary.totalAmount.toFixed(2))})
          <div className="mt-2">
            <div className="h-24 overflow-y-scroll bg-gray-300">
              {data.bridge.tokens.filter(t => t.token.price && t.amount).map((t, i) =>
                  <TokenInfo key={t.token.address} tokenHolding={t} className={ i % 2 === 0? "bg-gray-300": "bg-gray-200"}/>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
}

function Loading() {
  return "Loading...";
}

function Error() {
  return "Error...";
}