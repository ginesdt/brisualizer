import {DepositInfo, DepositStatus, Nonce, TransactionInfo, TxHash} from "@/lib/types";
import prisma from "@/lib/db";
import {depositInfoFromDb, depositInfoToDb} from "@/lib/deposit/db-utils";
import {DefaultArgs, GetFindResult} from "@prisma/client/runtime/library";
import {Prisma} from ".prisma/client";
import DepositTransactionCreateInput = Prisma.DepositTransactionCreateInput;
import {logger} from "@logger";
import {DEFAULT_LIMIT, DEFAULT_OFFSET} from "@/lib/constants";
import SortOrder = Prisma.SortOrder;
import {filterQuery} from "@/lib/commons/db-utils";
import DepositWhereInput = Prisma.DepositWhereInput;

export async function storeDepositData(depositsInfos: Map<TxHash, DepositInfo>): Promise<void> {
  for (const depositInfo of Array.from(depositsInfos.values()).filter((di => di.nonce))) {
    const {id} = await prisma.deposit.upsert({
      where: {
        l2Chain_nonce: {
          l2Chain: depositInfo.chain,
          nonce: depositInfo.nonce as string
        }
      },
      update: depositInfoToDb(depositInfo),
      create: depositInfoToDb(depositInfo),
    });
    if (depositInfo.transactions) {
      for (const transaction of depositInfo.transactions) {
        await prisma.depositTransaction.upsert({
          where: {
            chain_txHash: {
              chain: transaction.chain,
              txHash: transaction.txHash
            }
          },
          update: {...transaction, depositId: id},
          create: {...transaction, depositId: id}
        });
      }
    }
  }
}

export async function fetchDepositsFromNonces(depositNonces: string[]) : Promise<Map<Nonce, DepositInfo>>  {
  const deposits = await prisma.deposit.findMany({
    where: {nonce: {in: depositNonces}}});
  return deposits.reduce((res: Map<Nonce, DepositInfo>, deposit: GetFindResult<Prisma.$DepositPayload<DefaultArgs>, { where: { nonce: { in: string[] } } }>) => {
    return res.set(deposit.nonce, depositInfoFromDb(deposit));
  },new Map<Nonce, DepositInfo>());
}

export async function updateDepositsStatus(depositNonces: Map<Nonce, TransactionInfo>, status: DepositStatus): Promise<void> {
  const deposits = await prisma.deposit.findMany({
    select: {id: true, nonce: true},
    where: {nonce: {in: Array.from(depositNonces.keys())}}});

  for (const ti of deposits.map(({id, nonce}: {id: number, nonce: string}): DepositTransactionCreateInput => {
    const transactionInfo = depositNonces.get(nonce) as TransactionInfo;
    return {...transactionInfo, ...{deposit: {connect: {id: id}}, transitionedTo: status}}
  })) {
    await prisma.depositTransaction.upsert(
      {
        where: {
          chain_txHash: {
            chain: ti.chain,
            txHash: ti.txHash
          }
        },
        update: {},
        create: ti
      }
    );
  }

  const res = await prisma.deposit.updateMany(
    {
      where: {nonce: {in: Array.from(depositNonces.keys())}},
      data: {status: status}
    });
  logger.info(`change deposit status to ${status.valueOf()} to ${res.count} records`);
}

export async function storeDepositFinalizePrice(deposits: DepositInfo[]): Promise<void> {
  for (const di of deposits) {
    if (di.nonce) {
      await prisma.deposit.update(
        {
          where: {
            l2Chain_nonce: {
              l2Chain: di.chain,
              nonce: di.nonce
            }
          },
          data: {l2Price: di.l2Price}
        });
    }
  }
}

export async function countDeposits({chainId, address, coins, status} : {chainId: number, address: string | undefined, coins: string[] | undefined, status: number | undefined}): Promise<number> {
  return prisma.deposit.count({where: filterQuery(chainId, address, coins, status) as DepositWhereInput});
}

export async function fetchDeposits({chainId, limit = DEFAULT_LIMIT, offset = DEFAULT_OFFSET, address, coins, status} : {chainId: number, limit: number, offset:number, address: string | undefined, coins: string[] | undefined, status: number | undefined}): Promise<DepositInfo[]> {
  const filter = filterQuery(chainId, address, coins, status) as DepositWhereInput;

  const depositTxs = await prisma.depositTransaction.findMany({
    skip: offset,
    take: limit,
    include: {
      deposit:{
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
      deposit: filter
    }
  });

  return depositTxs.map(tx => depositInfoFromDb(tx.deposit))
}