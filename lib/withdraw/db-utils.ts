import {TransactionInfo, WithdrawInfo} from "@/lib/types";
import {Prisma} from "@prisma/client";
import WithdrawCreateInput = Prisma.WithdrawCreateInput;
import {transactionInfoFromDb} from "@/lib/commons/db-utils";

export function withdrawInfoToDb(wi : WithdrawInfo): WithdrawCreateInput {
  return {
    l2Chain: wi.chain,
    status: wi.status,
    from: wi.from,
    to: wi.to,
    l1Token: wi.l1Token,
    l2Token: wi.l2Token,
    amount: wi.amount?.toString(),
    withdrawalHash: wi.withdrawalHash as string,
    nonce: wi.nonce ?? null,
    // transactions: ... ,
    l1Price: wi.l1Price ?? null,
    l2Price: wi.l2Price ?? null
  }
}

export function withdrawInfoFromDb(wi: any): WithdrawInfo {
  return {
    chain: wi.l2Chain,
    status: wi.status?.valueOf(),
    from: wi.from,
    to: wi.to,
    l1Token: wi.l1Token,
    l2Token: wi.l2Token,
    amount: wi.amount,
    withdrawalHash: wi.withdrawalHash as string,
    nonce: wi.nonce ?? undefined,
    transactions: wi.transactions ? wi.transactions.map( (ti: any) => transactionInfoFromDb(ti)) : undefined,
    l1Price: wi.l1Price ?? undefined,
    l2Price: wi.l2Price ?? undefined
  }
}