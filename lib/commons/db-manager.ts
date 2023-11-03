import {ChainInfo, OperationType, Token} from "@/lib/types";
import prisma from "@/lib/db";
import {tokenInfoFromDb, tokenInfoToDb} from "@/lib/commons/db-utils";

export async function fetchTokensInfos({chainId}: {chainId: number}): Promise<Token[]> {
  let tokens = await prisma.tokenInfo.findMany({
    where: {
      chain: chainId
    }
  });
  return tokens.map(tokenInfoFromDb);
}

export async function storeTokensInfos(tokens: Token[]): Promise<void> {
  for (const tokenInfo of tokens) {
    await prisma.tokenInfo.upsert({
      where: {
        chain_address: {
          chain: tokenInfo.chain,
          address: tokenInfo.address
        }
      },
      update: {price: tokenInfo.price},
      create: tokenInfoToDb(tokenInfo)
    })
  }
}

//
// export async function fetchTokensMappings({chainId}:{chainId: number}) {
//   const withdrawMappings = (await prisma.withdraw.groupBy({
//     by: ['l2Chain', 'l2Token', 'l1Token'],
//     where: {l2Chain: chainId}
//   })).map((m) => {
//     return {[m.l1Token]: m.l2Token};}
//   );
//   const depositMappings = (await prisma.deposit.groupBy({
//     by: ['l2Chain', 'l2Token', 'l1Token'],
//     where: {l2Chain: chainId}
//   })).map((m) => {
//     return {[m.l1Token]: m.l2Token};}
//   );
//
//   return {...withdrawMappings, ...depositMappings};
// }

export async function fetchFirstBlock(sourceChain: ChainInfo, targetChain: ChainInfo, operationType: OperationType): Promise<number> {
  const record = await prisma.processedBlock.findUnique({where: {
      chainSource_chainTarget_operationType: {
        chainSource: sourceChain.chainId,
        chainTarget: targetChain.chainId,
        operationType: operationType}}});
  if (record && record.lastBlock) {
    return record.lastBlock
  }
  return sourceChain.defaultFirstBlock
}

export async function storeLastBlock(sourceChainId: number, targetChainId: number, lastBlock: number, operationType: number): Promise<void> {
  await prisma.processedBlock.upsert({
    where: {
      chainSource_chainTarget_operationType: {
        chainSource: sourceChainId,
        chainTarget: targetChainId,
        operationType: operationType
      }
    },
    update: {lastBlock: lastBlock},
    create: {
      chainSource: sourceChainId,
      chainTarget: targetChainId,
      operationType: operationType,
      lastBlock: lastBlock
    }
  });
}

