import prisma from "@/lib/db";
import {tokenInfoToDb} from "@/lib/commons/db-utils";
import {BridgeInfo, TokenWithAmount} from "@/lib/types";
import {bridgeInfoFromDb} from "@/lib/bridge/db-utils";

export async function storeTokensHolding(tokens: TokenWithAmount[], chainId: number): Promise<void> {
  const bi = await prisma.bridgeInformation.findFirst({
    select: {
      id: true
    },
    where: {
      chainId: chainId
    }});

  if (!bi)
    return;  // TODO better throw an error

  for (const tokenInfo of tokens) {
    const tokenDb = await prisma.tokenInfo.upsert({
      where: {
        chain_address: {
          chain: tokenInfo.chain,
          address: tokenInfo.address
        }
      },
      update: {price: tokenInfo.price},
      create: tokenInfoToDb(tokenInfo)
    })

    await prisma.tokenHolding.upsert(
      {
        where: {
          bridgeInformationId_tokenInfoId: {
            tokenInfoId: tokenDb.id,
            bridgeInformationId: bi.id
          }
        },
        update: {amount: tokenInfo.amount},
        create: {
          amount: tokenInfo.amount,
          tokenInfoId: tokenDb.id,
          bridgeInformationId: bi.id
        }
      }
    )
  }
}

export async function updateNativeCoin({amount, price}: {amount: string, price: string}, chainId: number): Promise<void> {
  await prisma.bridgeInformation.update({
    where: {
      chainId: chainId
    },
    data: {
      nativeCoinAmount: amount,
      nativeCoinPrice: price
    }});
}

export async function fetchBridgeInfo({chainId}: {chainId: number}) : Promise<BridgeInfo> {
  let bridgeInfo = await prisma.bridgeInformation.findFirst({
    include: {
      tokens: {
        include: {tokenInfo: true}
      },
      addresses: true
    },
    where: {
      chainId: chainId
    }});
  return bridgeInfoFromDb(bridgeInfo);
}