import {DepositInfo, Token, TokenAddress, WithdrawInfo} from "@/lib/types";
import React, {useState} from "react";
import {
  addressLink,
  addThousandsSeparator,
  cutAddress,
  cutCoinName,
  cutHash,
  formatCoin, tokenLink,
  txLink
} from "@/lib/api/utils";
import TimeAgo from 'timeago-react'
import {Status} from "@/components/bridge/status";
import Link from "next/link";
import Image from "next/image";
import {ZERO_ADDRESS} from "@/lib/constants";


export default function ExchangeCard({di, coins, statusesNames, isDeposit}: {di: DepositInfo | WithdrawInfo, coins: Map<TokenAddress, Token>, statusesNames: string[], isDeposit: boolean}) {
  const [expanded, setExpanded] = useState(false);

  const token = coins.get(di.l1Token);

  const priceProp = isDeposit ? "l1Price" : "l2Price";

  if (expanded) {
    return (
        <div className={`relative rounded-xl border border-gray-300 bg-gray-50 shadow-md`}>
            <div className="absolute right-1 top-1">
                <button type="button" className="focus:outline-none text-black bg-gray-200 hover:bg-gray-300 font-medium rounded-md text-sm px-2 py-1 mb-2" onClick={() => setExpanded(false)}>↑</button></div>
            <div className="flex pt-2">
                <div className="">
                    <div className="flex px-5">From: <Link className="pl-1 hover:font-medium" href={addressLink(isDeposit ? 1: di.chain, di.from)} target="_blank">{di.from}</Link></div>
                    <div className="flex px-5 pb-2">To: <Link className="pl-1 hover:font-medium" href={addressLink(isDeposit ? di.chain: 1, di.to)} target="_blank">{di.to}</Link></div>
                </div>
                <div>
                    <Status classname="justify-center" status={di.status} finalStatus={statusesNames.length - 1}/>
                    <div className="text-center">
                        {statusesNames[di.status]}
                    </div>
                </div>
            </div>
            <div className="flex justify-end px-5 pb-2">
              <Link className={`hover:font-medium ${token?.address === ZERO_ADDRESS ? 'disabled' : ''}`} title={"$" + token?.price} target="_blank" href={tokenLink(token?.chain as number, token?.address as string)}>
                <div className="flex space-x-2">
                    <div>
                        {addThousandsSeparator(formatCoin(di.amount, token?.decimals, 4))}
                    </div>
                    <div>
                        {token?.name}
                    </div>
                    <div>
                        {di[priceProp] ? `($${addThousandsSeparator((di[priceProp] as number * parseFloat(formatCoin(di.amount, token?.decimals))).toFixed(2))})`: ""}
                    </div>
                    <div>
                      {token?.logoUrl? <Image width="24" height="24" src={token?.logoUrl} alt={`${token?.name} logo`} /> : <></> }
                    </div>
                </div>
              </Link>
            </div>
            <div className="px-5 pb-3">
                {di.transactions?.map(t =>
                    <div key={t.txHash} className="grid grid-cols-[20%_60%_20%]">
                        <div>{t.transitionedTo !== undefined ? `${statusesNames[t.transitionedTo]} Tx:` : ''}</div>
                        <div><Link className="hover:font-medium" target="_blank" href={txLink(t.chain, t.txHash)}>{cutHash(t.txHash)}</Link></div>
                        <div title={new Date(parseInt(t.timestamp.toFixed() + "000")).toUTCString()}>
                            <TimeAgo datetime={t.timestamp.toFixed() + "000"} />
                        </div>
                    </div>)}
            </div>
        </div>
    );
  }

  return (
      <div className={`relative h-20 rounded-xl border border-gray-200 bg-white shadow-md`}>
        <div className="absolute right-1 top-1">
          <button type="button" className="focus:outline-none text-black bg-gray-200 hover:bg-gray-300 font-medium rounded-md text-sm px-2 py-1 mb-2" onClick={() => setExpanded(true)}>↓</button></div>
          <div className="flex justify-between w-11/12 py-2">
              <div className="flex px-5">From: <Link className="pl-1 hover:font-medium" href={addressLink(isDeposit ? 1: di.chain, di.from)} target="_blank">{cutAddress(di.from)}</Link></div>
              <div className="flex items-center">
                  <div className="pr-2">
                      {statusesNames[di.status]}
                  </div>
                  <Status status={di.status} finalStatus={statusesNames.length - 1}/>
              </div>
          </div>
          <div className="flex justify-between px-5">
            <div title={new Date(parseInt(di.transactions?.at(0)?.timestamp.toFixed() + "000")).toUTCString()}>
              <TimeAgo datetime={di.transactions?.at(0)?.timestamp.toFixed() + "000"} />
            </div>
            <Link className={`hover:font-medium ${token?.address === ZERO_ADDRESS ? 'disabled' : ''}`} title={"$" + token?.price} target="_blank" href={tokenLink(token?.chain as number, token?.address as string)}>
              <div className="flex space-x-2">
                <div>
                  {addThousandsSeparator(formatCoin(di.amount, token?.decimals, 4))}
                </div>
                <div>
                  {cutCoinName(token?.name)}
                </div>
                <div>
                  {di[priceProp] ? `($${addThousandsSeparator((di[priceProp] as number * parseFloat(formatCoin(di.amount, token?.decimals, null))).toFixed(2))})`: ""}
                </div>
                <div>
                  {token?.logoUrl? <Image width="24" height="24" src={token?.logoUrl} alt={`${token?.name} logo`} /> : <></> }
                </div>
              </div>
            </Link>
          </div>
      </div>
  );
}
