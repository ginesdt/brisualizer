import {Token, TransactionInfo} from "@/lib/types";
import {Prisma} from ".prisma/client";
import TokenInfoCreateInput = Prisma.TokenInfoCreateInput;
import deepmerge from "deepmerge";
import DepositWhereInput = Prisma.DepositWhereInput;
import WithdrawWhereInput = Prisma.WithdrawWhereInput;

export function tokenInfoToDb(t: Token): TokenInfoCreateInput {
  return {
    chain: t.chain,
    address: t.address,
    name: t.name,
    decimals: t.decimals,
    symbol: t.symbol,
    logoUrl: t.logoUrl,
    verified: t.verified,
    stable: t.stable,
    price: t.price
  }
}

export function tokenInfoFromDb(t: any): Token {
  return {
    chain: t.chain,
    address: t.address,
    name: t.name,
    decimals: t.decimals,
    symbol: t.symbol,
    logoUrl: t.logoUrl,
    verified: t.verified,
    stable: t.stable,
    price: t.price
  }
}

export function transactionInfoFromDb(ti: any): TransactionInfo {
  return {
    txHash: ti.txHash,
    chain: ti.chain,
    txFrom: ti.txFrom,
    txTo: ti.txTo,
    block: ti.block,
    timestamp: ti.timestamp,
    transitionedTo: ti.transitionedTo ?? undefined
  }
}

export function filterQuery (chainId: number, address: string | undefined, coins: string[] | undefined, status: number | undefined): DepositWhereInput | WithdrawWhereInput {
  let filter : any = {}

  filter.l2Chain = chainId

  if (address) {
    filter = deepmerge(filter, {
      AND: {
        OR: [
          {from: {contains: address}},
          {to: {contains: address}}
        ]
      }
    });
  }

  if (coins) {
    filter = deepmerge(filter, {
      AND: {
        l1Token: {
          in: coins
        }
      }
    });
  }

  if (status !== undefined) {
    filter = deepmerge(filter, {
      AND: {
        status: status
      }
    });
  }
  return filter;
}
