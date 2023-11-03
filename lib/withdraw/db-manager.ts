import {DepositStatus, TransactionInfo, TxHash, WithdrawalHash, WithdrawInfo, WithdrawStatus} from "@/lib/types";
import prisma from "@/lib/db";
import {Prisma} from ".prisma/client";
import WithdrawTransactionCreateInput = Prisma.WithdrawTransactionCreateInput;
import {DefaultArgs, GetFindResult} from "@prisma/client/runtime/library";
import {withdrawInfoFromDb, withdrawInfoToDb} from "@/lib/withdraw/db-utils";
import {logger} from "@logger";
import SortOrder = Prisma.SortOrder;
import {DEFAULT_LIMIT, DEFAULT_OFFSET} from "@/lib/constants";
import {filterQuery} from "@/lib/commons/db-utils";
import WithdrawWhereInput = Prisma.WithdrawWhereInput;

export async function updateWithdrawStatuses(withdrawsHashes: Map<TxHash, TransactionInfo>, status: WithdrawStatus): Promise<void> {
  const withdraws = await prisma.withdraw.findMany({
    select: {id: true, withdrawalHash: true},
    where: {withdrawalHash: {in: Array.from(withdrawsHashes.keys())}}});

  for (const ti of withdraws.map(({id, withdrawalHash}: {id: number, withdrawalHash: string}): WithdrawTransactionCreateInput => {
    const transactionInfo = withdrawsHashes.get(withdrawalHash) as TransactionInfo;
    return {...transactionInfo, ...{withdraw: {connect: {id: id}}, transitionedTo: status}}
  })) {
    await prisma.withdrawTransaction.upsert({
      where: {
        chain_txHash: {
          chain: ti.chain,
          txHash: ti.txHash
        }
      },
      update: {},
      create: ti
    });
  }

  const res = await prisma.withdraw.updateMany(
    {
      where: {withdrawalHash: {in: Array.from(withdrawsHashes.keys())}},
      data: {status: status}
    });
  logger.info(`change withdraw status to ${status.valueOf()} to ${res.count} records`);
}

export async function fetchWithdrawsFromHashes(withdrawHashes: string[]) : Promise<Map<WithdrawalHash, WithdrawInfo>> {
  const withdraws = await prisma.withdraw.findMany({
    where: {withdrawalHash: {in: withdrawHashes}}});
  return withdraws.reduce((res: Map<WithdrawalHash, WithdrawInfo>, withdraw: GetFindResult<Prisma.$WithdrawPayload<DefaultArgs>, { where: { withdrawalHash: { in: string[] } } }>) => {
    return res.set(withdraw.withdrawalHash, withdrawInfoFromDb(withdraw));
  },new Map<WithdrawalHash, WithdrawInfo>());
}

export async function storeWithdrawData(withdrawsInfos: Map<TxHash, WithdrawInfo>): Promise<void> {
  for (const withdrawInfo of Array.from(withdrawsInfos.values()).filter((wi => wi.withdrawalHash))) {
    const {id} = await prisma.withdraw.upsert({
      where: {
        l2Chain_withdrawalHash: {
          l2Chain: withdrawInfo.chain,
          withdrawalHash: withdrawInfo.withdrawalHash as string
        }
      },
      update: withdrawInfoToDb(withdrawInfo),
      create: withdrawInfoToDb(withdrawInfo),
    });
    if (withdrawInfo.transactions) {
      for (const transaction of withdrawInfo.transactions) {
        await prisma.withdrawTransaction.upsert({
          where: {
            chain_txHash: {
              chain: transaction.chain,
              txHash: transaction.txHash
            }
          },
          update: {...transaction, withdrawId: id},
          create: {...transaction, withdrawId: id}
        });
      }
    }
  }
}

export async function storeWithdrawFinalizePrice(withdraws: WithdrawInfo[]): Promise<void> {
  for (const wi of withdraws.values()) {
    if (wi.withdrawalHash) {
      await prisma.withdraw.update(
        {
          where: {
            l2Chain_withdrawalHash: {
              l2Chain: wi.chain,
              withdrawalHash: wi.withdrawalHash
            }
          },
          data: {l2Price: wi.l2Price}
        });
    }
  }
}

export async function countWithdraws({chainId, address, coins, status} : {chainId: number, address: string | undefined, coins: string[] | undefined, status: number | undefined}): Promise<number> {
  return prisma.withdraw.count({where: filterQuery(chainId, address, coins, status) as WithdrawWhereInput});
}


export async function fetchWithdraws({chainId, limit = DEFAULT_LIMIT, offset = DEFAULT_OFFSET, address, coins, status} : {chainId: number, limit: number, offset:number, address: string | undefined, coins: string[] | undefined, status: number | undefined}): Promise<WithdrawInfo[]> {
  const filter = filterQuery(chainId, address, coins, status) as WithdrawWhereInput;

  const withdrawTxs = await prisma.withdrawTransaction.findMany({
    skip: offset,
    take: limit,
    include: {
      withdraw:{
        include: {
          transactions: {
            orderBy: {
              timestamp: SortOrder.asc
            }
          }}}},
    orderBy: {
      timestamp: SortOrder.desc
    },
    where: {
      transitionedTo: DepositStatus.Initialized,
      withdraw: filter
    }
  });

  return withdrawTxs.map(tx => withdrawInfoFromDb(tx.withdraw))
}