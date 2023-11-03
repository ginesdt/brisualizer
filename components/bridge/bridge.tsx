'use client'

import {useState} from "react";
import {DepositList, WithdrawList} from "@/components/bridge/exchange-list";
import {FilterBar} from "@/components/bridge/filter-bar";
import {BridgeInfo} from "@/components/bridge/bridge-info";
import useSWR from "swr";
import {ResponseData} from "@/pages/api/coins";
import {fetcher} from "@/lib/api/utils";
import {ZERO_ADDRESS} from "@/lib/constants";
import {Token, TokenAddress} from "@/lib/types";


export default function Bridge({chainId}: {chainId: number}) {
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [address, setAddress] = useState("");
    const [filterCoins, setFilterCoins]: [string[], any] = useState([]);
    const [depositStatus, setDepositStatus]: [number|undefined, any] = useState();
    const [withdrawStatus, setWithdrawStatus]: [number|undefined, any] = useState();

    const {data, error, isLoading} = useSWR<ResponseData>(`/api/coins?chainId=${chainId}`, fetcher);
    let coins;
    const nativeCoin = {
        name: "ETH",
        logoUrl: "https://assets.coingecko.com/coins/images/279/standard/ethereum.png",
        address: ZERO_ADDRESS,
        chain: 1,
        decimals: 18,
        symbol: "",
        stable: false,
        verified: true,
        price: "0"
    };
    if (data?.success) {
        coins = [nativeCoin, ...data.tokens];
    }

    const coinsMap = new Map<TokenAddress, Token>(coins?.map(t => [t.address, t]));


    return (
        <>
          <FilterBar chainId={chainId} address={address} onChangeAddress={setAddress} autoRefresh={autoRefresh} onChangeAutoRefresh={setAutoRefresh}
                     onChangeFilterCoins={setFilterCoins} onChangeDepositStatus={setDepositStatus} onChangeWithdrawStatus={setWithdrawStatus} coins={coins} coinsLoading={isLoading}/>
          <BridgeInfo chainId={chainId} autoRefresh={autoRefresh} />
          <div className={"grid grid-cols-2 gap-10 h-screen w-full max-w-screen-xl"}>
            <DepositList chainId={chainId} address={address} autoRefresh={autoRefresh} filterCoins={filterCoins} coins={coinsMap} status={depositStatus} coinsLoading={isLoading}/>
            <WithdrawList chainId={chainId} address={address} autoRefresh={autoRefresh} filterCoins={filterCoins} coins={coinsMap} status={withdrawStatus} coinsLoading={isLoading}/>
          </div>
        </>
    );
}
