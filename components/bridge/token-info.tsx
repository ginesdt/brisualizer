import {addThousandsSeparator, formatCoin, tokenLink} from "@/lib/api/utils";
import {TokenHoldingInfo, TokenWithAmount} from "@/lib/types";
import Link from "next/link";
import Image from "next/image";


export function TokenInfo({tokenHolding, className} : {tokenHolding : TokenHoldingInfo, className: string}) {
    return <div key={tokenHolding.token.address} className={className}>
        <div className="grid grid-cols-[50%_5%_45%] overflow-x-hidden">
            <span className="pl-3">{addThousandsSeparator(formatCoin(tokenHolding.amount, tokenHolding.token.decimals))} (${addThousandsSeparator((parseFloat(tokenHolding.token.price) * parseFloat(formatCoin(tokenHolding.amount, tokenHolding.token.decimals))).toFixed(2))})</span>
            {tokenHolding.token.logoUrl? <Image width="24" height="24" src={tokenHolding.token.logoUrl} alt={`${tokenHolding.token.name} logo`}/> : <div></div>}
            <Link className="hover:font-medium" title={"$" + tokenHolding.token.price} target="_blank" href={tokenLink(tokenHolding.token.chain, tokenHolding.token.address)}>{tokenHolding.token.name}</Link>
        </div>
    </div>
}