import {NextApiRequest} from "next";
import {CHAINS, DEFAULT_LIMIT, DEFAULT_OFFSET, MAX_LIMIT} from "@/lib/constants";
import {TokenHoldingInfo} from "@/lib/types";

export const fetcher = (url: string) => fetch(url).then((res) => res.json());


export function parseRequest(req: NextApiRequest): { error: string } | { address: string | undefined, coins: string[] | undefined, status: number | undefined, offset: number, chainId: number, limit: number } {
    const chainId = parseChain(req)
    if (typeof chainId === "object")
        return chainId;

    let limit = req.query["limit"] ? parseInt(req.query["limit"] as string) : DEFAULT_LIMIT;
    if (limit > MAX_LIMIT)
        limit = MAX_LIMIT;
    let offset = req.query["offset"] ? parseInt(req.query["offset"] as string) : DEFAULT_OFFSET;
    if (offset < 0)
        offset = 0;
    let address = req.query["address"] as string | undefined
    if (address && address.trim().length === 0)
        address = undefined;

    let coinParam = req.query["coin"];
    let coins: string[] | undefined
    if (coinParam && !Array.isArray(coinParam))
        coins = [coinParam]
    else
        coins = coinParam as string[] | undefined

    let status = req.query["status"] ? parseInt(req.query["status"] as string) : undefined;

    return {chainId, limit, offset, address, coins, status};
}

export function parseChain(req: NextApiRequest): { error: string } | number {
    const chainIdParam = req.query["chainId"];
    if (chainIdParam === undefined) {
        return {error :"missing parameter 'chainId'"};
    }
    if (Number.isNaN(chainIdParam)) {
        return {error: `wrong parameter 'chainId'. Expected number, found: ${chainIdParam}`};
    }
    return parseInt(chainIdParam as string);
}

export function safeNumber(n: number | string): string {
    let a;
    if (typeof n === "string" && (a = n.toLowerCase().match("^(\\d+)(?:\\.(\\d+))?e\\+(\\d+)$")))
        return `${a[1]}${a[2]??''}${"0".repeat(parseInt(a[3]) - (a[2]?.length ?? 0))}`;
    return n.toString();
}


export function addThousandsSeparator(amount: number|string) : string {
    const a = safeNumber(amount)
    const b = a.split('.');
    return b[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + b[1];
}

export function formatCoin(amount: number|string, coinDecimals: number = 18, decimalShown: number | null = 4) : string {
    const number = safeNumber(amount);
    const length = number.length - coinDecimals;
    let b;
    if (length <= 0) {
        b = `0.${"0".repeat(Math.abs(length))}`;
    } else {
        b = `${number.substring(0, length)}.`;
    }
    if (decimalShown !== null)
        return b + number.substring(Math.max(0,length), length + decimalShown);
    return b + number.substring(Math.max(0,length));
}

export function addressLink(chain: number, address: string) {
    return Object.values(CHAINS).filter(c => c.chainId === chain).at(0)?.addressUrl + address;
}

export function txLink(chain: number, tx: string) {
    return Object.values(CHAINS).filter(c => c.chainId === chain).at(0)?.transactionUrl + tx;
}

export function tokenLink(chain: number, tx: string) {
    return Object.values(CHAINS).filter(c => c.chainId === chain).at(0)?.tokenUrl + tx;
}

export function cutAddress(address: string) {
    return `${address.substring(0, 6)}...${address.substring(36)}`;
}

export function cutHash(address: string) {
    return `${address.substring(0, 14)}...${address.substring(50)}`;
}

export function cutCoinName(name: string| undefined) {
    if (name) {
        if (name.length < 18)
            return name;
        return `${name.substring(0, 10)}...${name.substring(name.length - 5)}`;
    }
}

export function tokenSorter(a: TokenHoldingInfo, b: TokenHoldingInfo) {
    return ((b.amount? parseFloat(formatCoin(b.amount, b.token.decimals, null)) : 0) * (b.token.price ? parseFloat(b.token.price) : 0) ) - ((a.amount? parseFloat(formatCoin(a.amount, a.token.decimals, null)) : 0) * (a.token.price? parseFloat(a.token.price) : 0))
}
