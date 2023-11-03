import {DepositInfo} from "@/lib/types";
import {transactionInfoFromDb} from "@/lib/commons/db-utils";

export function depositInfoToDb(di: DepositInfo) {
  return {
    l2Chain: di.chain,
    status: di.status,
    from: di.from,
    to: di.to,
    l1Token: di.l1Token,
    l2Token: di.l2Token,
    amount: di.amount?.toString(),
    nonce: di.nonce as string,
    // transactions: {create: di.transactions},
    l1Price: di.l1Price ?? null,
    l2Price: di.l2Price ?? null
  }
}

export function depositInfoFromDb(di: any): DepositInfo  {
  return {
    chain: di.l2Chain,
    status: di.status?.valueOf(),
    from: di.from,
    to: di.to,
    l1Token: di.l1Token,
    l2Token: di.l2Token,
    amount: di.amount,
    nonce: di.nonce as string,
    transactions: di.transactions ? di.transactions.map( (ti: any) => transactionInfoFromDb(ti)) : undefined,
    l1Price: di.l1Price ?? undefined,
    l2Price: di.l2Price ?? undefined
  }
}
