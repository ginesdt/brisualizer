import {ResponseData as DepositResponseData, SuccessResponse as DepositSuccessResponse} from "@/pages/api/deposits";
import {ResponseData as WithdrawResponseData, SuccessResponse as WithdrawSuccessResponse} from "@/pages/api/withdraws";
import {useEffect, useState} from "react";
import useSWR from "swr";
import {fetcher} from "@/lib/api/utils";
import {AUTO_REFRESH_MS} from "@/lib/constants";
import {Token, TokenAddress} from "@/lib/types";
import ExchangeCard from "@/components/bridge/exchange-card";
import {Navigator} from "@/components/bridge/navigator";


function Loading() {
  return <div className="h-[1600px]">
    Loading...
  </div>
}

function Error() {
  return <div className="h-[1600px]">
    An error has occurred.
  </div>
}

function ExchangesDetails<T extends DepositSuccessResponse | WithdrawSuccessResponse>({data, coins}: {data: T, coins: Map<TokenAddress, Token>}) {

  function isDepositResponse(data: DepositSuccessResponse | WithdrawSuccessResponse): data is DepositSuccessResponse {
    return (data as DepositSuccessResponse).deposits !== undefined;
  }

  return <div className="z-10 w-full px-5 xl:px-0">
    {isDepositResponse(data) ?
      data.deposits.map((di) => (
          <ExchangeCard key={di.nonce} di={di} coins={coins} isDeposit={true} statusesNames={["Initialized", "Finalized"]}></ExchangeCard>))
        :
        data.withdraws.map((wi) => (
            <ExchangeCard key={wi.withdrawalHash} di={wi} coins={coins} isDeposit={false} statusesNames={["Initialized", "Proved", "Finalized"]}></ExchangeCard>))
    }
  </div>
}

function ExchangeList<T extends DepositResponseData|WithdrawResponseData> ({apiMethod, chainId, address, autoRefresh, coins, status, filterCoins, coinsLoading}: {apiMethod: "withdraws"|"deposits", chainId: number, address: string | undefined, autoRefresh: boolean, coins: Map<TokenAddress, Token> | undefined, filterCoins: string[], status: number | undefined, coinsLoading: boolean}) {
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    setPageIndex(0);
  }, [address, filterCoins, status])

  let url = `/api/${apiMethod}?chainId=${chainId}&offset=${pageIndex * limit}&limit=${limit}`;
  if (address)
    url += `&address=${address}`
  for (const coin of filterCoins) {
    url += `&coin=${coin}`;
  }
  if (status !== undefined)
    url += `&status=${status}`;
  const {data, error, isLoading} = useSWR<T>(
    url,
    fetcher,
    { refreshInterval: autoRefresh? AUTO_REFRESH_MS : undefined }
  );
  const isError = (error || !data?.success || !coins);

  let lastPage;
  if (!isError) lastPage = Math.ceil(data.count / limit);

  return <div className="w-full">
    {(()=>{
      if (isLoading || coinsLoading) {
        return <Loading />
      }
      if (isError) {
        return <Error />
      }
      return <ExchangesDetails data={data} coins={coins} />
    })()}
    <div className="pt-2 pb-10">
      <Navigator pageIndex={pageIndex} setPageIndex={setPageIndex} lastPage={lastPage ?? 0}/>
    </div>
  </div>
}

export function WithdrawList ({chainId, address, autoRefresh, coins, filterCoins, status, coinsLoading}: {chainId: number, address: string, autoRefresh: boolean, coins: Map<TokenAddress, Token> | undefined, filterCoins: string[], status: number | undefined, coinsLoading: boolean}) {
  return <div>
    <div className="flex items-center space-x-2"><h1 className={"text-2xl"}>Withdrawals</h1><h2>(L1 ⇦ L2)</h2></div>
    <ExchangeList apiMethod={"withdraws"} chainId={chainId} address={address} autoRefresh={autoRefresh} coins={coins} filterCoins={filterCoins} status={status} coinsLoading={coinsLoading}/>
  </div>
}

export function DepositList ({chainId, address, autoRefresh, coins, filterCoins, status, coinsLoading}: {chainId: number, address: string, autoRefresh: boolean, coins: Map<TokenAddress, Token> | undefined, filterCoins: string[], status: number|undefined, coinsLoading: boolean}) {
  return <div>
    <div className="flex items-center space-x-2"><h1 className={"text-2xl"}>Deposits</h1><h2>(L1 ⇨ L2)</h2></div>
    <ExchangeList apiMethod={"deposits"} chainId={chainId} address={address} autoRefresh={autoRefresh} coins={coins} filterCoins={filterCoins} status={status} coinsLoading={coinsLoading}/>
  </div>
}