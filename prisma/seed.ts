import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const optimism = await prisma.bridgeInformation.upsert({
    where: {chainId: 10},
    update: {},
    create: {
      chainId: 10,
      chainName: 'Optimism',
      nativeCoinAmount: "0",
      nativeCoinPrice: "0",
      addresses: {
        create: [
          {
            chain: 1,
            address: "0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1",
            name: "L1StandardBridge"
          },
          {
            chain: 1,
            address: "0xbeb5fc579115071764c7423a4f12edde41f106ed",
            name: "OptimismPortal"
          },
          {
            chain: 10,
            address: "0x4200000000000000000000000000000000000010",
            name: "L2StandardBridge"
          },
        ]}
    },
  })

  const base = await prisma.bridgeInformation.upsert({
    where: {chainId: 8453},
    update: {},
    create: {
      chainId: 8453,
      chainName: 'Base',
      nativeCoinAmount: "0",
      nativeCoinPrice: "0",
      addresses: {
        create: [
          {
            chain: 1,
            address: "0x3154Cf16ccdb4C6d922629664174b904d80F2C35",
            name: "L1StandardBridge"
          },
          {
            chain: 1,
            address: "0x49048044D57e1C92A77f79988d21Fa8fAF74E97e",
            "name": "OptimismPortal"
          },
          {
            chain: 8453,
            address: "0x4200000000000000000000000000000000000010",
            name: "L2StandardBridge"
          },
        ]}
    },
  })

  console.log({ optimism, base })
}
main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
