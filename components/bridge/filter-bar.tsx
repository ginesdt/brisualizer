import Select from 'react-select'
import {Token} from "@/lib/types";
import Image from "next/image";
import {cutCoinName} from "@/lib/api/utils";


export function FilterBar ({chainId, address, onChangeAddress, autoRefresh, onChangeAutoRefresh, onChangeFilterCoins, onChangeDepositStatus, onChangeWithdrawStatus, coins, coinsLoading} :
                    {chainId: number, address: string, onChangeAddress: (a: string) => void, autoRefresh: boolean, onChangeAutoRefresh: (ar: boolean) => void,
                    onChangeFilterCoins: (coinAddresses: string[]) => void, onChangeDepositStatus: (status: number | undefined) => void, onChangeWithdrawStatus: (status: number | undefined) => void,
                    coins: Token[] | undefined, coinsLoading: boolean}) {


  return <div className={"fixed top-16 w-1/2 flex justify-center" +
      // " border-b border-x border-gray-400" +
      " rounded-b-full bg-gray-200 backdrop-blur-xl z-30 transition-all pb-1"}>
    <div>
        <div>Address</div>
        <input className="border rounded-[4px] border-[#cccccc] h-[38px] w-64 text-xs" type="text" value={address} onChange={e => onChangeAddress(e.target.value)}/>
    </div>

    <label>
      Coin
      <Select className="w-64" isLoading={coinsLoading} name="coins" isClearable
              onChange={(coin) => onChangeFilterCoins(coin?[coin.address]:[])}
              options={coins?.map(c => {return {...c, ...{value: c.address, label: c.name}}})}
              formatOptionLabel={coin => (
                <div className="flex justify-between">
                  <span>{cutCoinName(coin.name)}</span>
                  {coin.logoUrl? <Image width="24" height="24" src={coin.logoUrl} alt={`${coin.name} logo`} /> : <></>}
                </div>
              )}
      />
    </label>

    <label>
      Deposit Status
      <Select className="w-64" name="depositStatus" isClearable
              onChange={(s) => onChangeDepositStatus(s?.value)}
              options={[
                {value: 0, label: "Initialized"},
                {value: 1, label: "Finalized"}]}/>
    </label>

    <label>
      Withdraw Status
      <Select className="w-64" name="withdrawStatus" isClearable
              onChange={(s) => onChangeWithdrawStatus(s?.value)}
              options={[
                {value: 0, label: "Initialized"},
                {value: 1, label: "Proved"},
                {value: 2, label: "Finalized"}]}/>
    </label>

    {/*<label>*/}
    {/*  <input type="checkbox" checked={autoRefresh} onChange={() => onChangeAutoRefresh(!autoRefresh)} />*/}
    {/*  AutoRefresh*/}
    {/*</label>*/}

  </div>
}