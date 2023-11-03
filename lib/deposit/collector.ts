import {
  BridgeConfig,
  DepositInfo,
  DepositStatus,
  EventRaw,
  Nonce,
  OperationType,
  TransactionInfo,
  TxHash
} from "@/lib/types";
import {fetchLogs, fetchTransactionDetails, fetchTransactions} from "@/lib/commons/tx-info";
import {
  DEPOSIT_ERC20_METHOD_HASH, DEPOSIT_ERC20_TO_METHOD_HASH,
  DEPOSIT_ETH_METHOD_HASH, DEPOSIT_ETH_TO_METHOD_HASH,
  LOG_DEPOSIT_FINALIZED_TOPIC_0,
  LOG_ERC20_DEPOSIT_INITIALIZED_TOPIC_0,
  LOG_ETH_DEPOSIT_INITIALIZED_TOPIC_0,
  LOG_SENT_MESSAGE_TOPIC_0,
  LOG_SENT_MESSAGE_TOPIC_1,
  RELAY_MESSAGE_METHOD_HASH
} from "@/lib/constants";
import {fetchFirstBlock, storeLastBlock, storeTokensInfos} from "@/lib/commons/db-manager";
import {
  parseDepositErc20InitializedLog,
  parseDepositEthInitializedLog,
  parseDepositNonce,
  parseDepositNonceFromTx
} from "@/lib/deposit/parsers";
import {fillPriceDataL1, fillPriceDataL2} from "@/lib/commons/prices";
import {
  fetchDepositsFromNonces,
  storeDepositData,
  storeDepositFinalizePrice,
  updateDepositsStatus
} from "@/lib/deposit/db-manager";
import {logger} from "../../logger";

interface IDepositCollector {
  updateDeposits: () => Promise<{initializedDeposits: number, finalizedDeposits: number}>
}

export class DepositCollector implements IDepositCollector {
  private readonly bridgeConfig: BridgeConfig;

  constructor(bridgeConfig: BridgeConfig) {
    this.bridgeConfig = bridgeConfig;
  }

  public async updateDeposits(): Promise<{initializedDeposits: number, finalizedDeposits: number}> {
    const l1Info = await this.updateDepositsFromL1();
    const l2Info = await this.updateDepositsFromL2();
    return {...l1Info, ...l2Info}
  }

  private async updateDepositsFromL1(): Promise<{ initializedDeposits: number }> {
    logger.info(`Start updating deposits info from L1 ${this.bridgeConfig.l1.chainInfo.name} (L2: ${this.bridgeConfig.l2.chainInfo.name})`);
    const firstBlock = await fetchFirstBlock(this.bridgeConfig.l1.chainInfo, this.bridgeConfig.l2.chainInfo, OperationType.Deposit);
    logger.info(`Updating deposits from block: ${firstBlock}`);

    const {transactionsInfos, lastBlock} =
      await fetchTransactions(
        firstBlock,
        this.bridgeConfig.l1.chainInfo,
        this.bridgeConfig.l1.addresses.bridgeAddress,
        [DEPOSIT_ERC20_METHOD_HASH, DEPOSIT_ETH_METHOD_HASH, DEPOSIT_ETH_TO_METHOD_HASH, DEPOSIT_ERC20_TO_METHOD_HASH]);
    logger.info(`Found: ${transactionsInfos.size} deposit initialize transactions, until block: ${lastBlock}`);

    transactionsInfos.forEach((ti) => ti.transitionedTo = DepositStatus.Initialized);

    if (transactionsInfos.size > 0 && lastBlock) {
      const deposits: Map<TxHash, DepositInfo> = await this.createDepositInitData(firstBlock, lastBlock, transactionsInfos);
      logger.info(`Found initialized data for: ${deposits.size} transactions`);
      const noncesFound = await this.fillDepositMessageData(firstBlock, lastBlock, deposits);
      logger.info(`Filled nonce for: ${noncesFound} transactions`);
      const {tokens, pricesFilled} = await fillPriceDataL1(this.bridgeConfig, deposits);
      logger.info(`Filled price for: ${pricesFilled} transactions. Found ${tokens.length} different tokens`);

      await storeDepositData(deposits);
      logger.info("Deposits stored")
      await storeTokensInfos(tokens);
      logger.info("Tokens stored")
      await storeLastBlock(this.bridgeConfig.l1.chainInfo.chainId, this.bridgeConfig.l2.chainInfo.chainId, lastBlock, OperationType.Deposit);
      logger.info(`Last block stored for chain: ${this.bridgeConfig.l1.chainInfo.chainId}, lastBlock: ${lastBlock}, operation: ${OperationType.Deposit}`)
    }
    return {initializedDeposits: transactionsInfos.size}
  }

  private async updateDepositsFromL2(): Promise<{ finalizedDeposits: number }> {
    logger.info(`Start updating deposits info from L2 ${this.bridgeConfig.l2.chainInfo.name} (L1: ${this.bridgeConfig.l1.chainInfo.name})`);
    const firstBlock = await fetchFirstBlock(this.bridgeConfig.l2.chainInfo, this.bridgeConfig.l1.chainInfo, OperationType.Deposit);
    logger.info(`Updating deposits from block: ${firstBlock}`);

    const {transactionsInfos, lastBlock} =
      await fetchTransactions(
        firstBlock,
        this.bridgeConfig.l2.chainInfo,
        this.bridgeConfig.l2.addresses.crossDomainMessenger,
        [RELAY_MESSAGE_METHOD_HASH]);
    logger.info(`Found: ${transactionsInfos.size} cross-chain messages with potential finalized deposit transactions, until block: ${lastBlock}`);

    if (transactionsInfos.size > 0 && lastBlock) {
      const finalizedDeposits: Map<Nonce, TransactionInfo> = await this.fillDepositFinalizedData(firstBlock, lastBlock, transactionsInfos);
      logger.info(`Found deposit finalized data for: ${finalizedDeposits.size} deposits`);
      if (finalizedDeposits.size > 0) {
        await updateDepositsStatus(finalizedDeposits, DepositStatus.Finalized);
        await this.updateDepositFinalizePrice(Array.from(finalizedDeposits.keys()));
      }

      await storeLastBlock(this.bridgeConfig.l2.chainInfo.chainId, this.bridgeConfig.l1.chainInfo.chainId, lastBlock, OperationType.Deposit);
      logger.info(`Last block stored for chain: ${this.bridgeConfig.l2.chainInfo.chainId}, lastBlock: ${lastBlock}, operation: ${OperationType.Deposit}`)
      return {finalizedDeposits: finalizedDeposits.size}
    }
    return {finalizedDeposits: 0}
  }

  private async createDepositInitData(firstBlock: number, lastBlock: number, transactionsInfos: Map<TxHash, TransactionInfo>): Promise<Map<TxHash, DepositInfo>> {
    const erc20Deposits = await this.createDepositErc20InitData(firstBlock, lastBlock, transactionsInfos);
    const ethDeposits = await this.createDepositEthInitData(firstBlock, lastBlock, transactionsInfos);
    return new Map([...erc20Deposits, ...ethDeposits]);
  }

  private async createDepositErc20InitData(firstBlock: number, lastBlock: number, transactionsInfos: Map<TxHash, TransactionInfo>): Promise<Map<TxHash, DepositInfo>> {
    const logs = await fetchLogs(this.bridgeConfig.l1.chainInfo, firstBlock, lastBlock, this.bridgeConfig.l1.addresses.bridgeAddress, LOG_ERC20_DEPOSIT_INITIALIZED_TOPIC_0);
    return new Map(logs.map((event: EventRaw): [string, DepositInfo] | undefined => {
      const txHash = event.transactionHash;
      const transactionInfo = transactionsInfos.get(txHash);
      if (transactionInfo) {
        const depositInitializedLog = parseDepositErc20InitializedLog(event);
        return [txHash, {
          l1Token: depositInitializedLog.l1Token,
          l2Token: depositInitializedLog.l2Token,
          from: depositInitializedLog.from,
          to: depositInitializedLog.to,
          amount: depositInitializedLog.amount,
          status: DepositStatus.Initialized,
          chain: this.bridgeConfig.l2.chainInfo.chainId,
          transactions: [transactionInfo]
        }]
      }
    }).filter((r: [TxHash, DepositInfo] | undefined) => r) as [TxHash, DepositInfo][]);
  }

  private async createDepositEthInitData(firstBlock: number, lastBlock: number, transactionsInfos: Map<TxHash, TransactionInfo>): Promise<Map<TxHash, DepositInfo>> {
    const logs = await fetchLogs(this.bridgeConfig.l1.chainInfo, firstBlock, lastBlock, this.bridgeConfig.l1.addresses.bridgeAddress, LOG_ETH_DEPOSIT_INITIALIZED_TOPIC_0);
    return new Map(logs.map((event: EventRaw): [TxHash, DepositInfo] | undefined => {
      const txHash = event.transactionHash;
      const transactionInfo = transactionsInfos.get(txHash);
      if (transactionInfo) {
        const depositInitializedLog = parseDepositEthInitializedLog(event);
        return [txHash, {
          l1Token: this.bridgeConfig.l2.addresses.ethTokenAddress,
          l2Token: this.bridgeConfig.l2.addresses.wrappedEthTokenAddress,
          from: depositInitializedLog.from,
          to: depositInitializedLog.to,
          amount: depositInitializedLog.amount,
          status: DepositStatus.Initialized,
          chain: this.bridgeConfig.l2.chainInfo.chainId,
          transactions: [transactionInfo]
        }]
      }
    }).filter((r: [TxHash, DepositInfo] | undefined) => r) as [TxHash, DepositInfo][]);
  }

  private async fillDepositMessageData(firstBlock: any, lastBlock: number, depositsInfos: Map<TxHash, DepositInfo>): Promise<number> {
    const logs = await fetchLogs(this.bridgeConfig.l1.chainInfo, firstBlock, lastBlock, this.bridgeConfig.l1.addresses.crossDomainMessenger, LOG_SENT_MESSAGE_TOPIC_0, LOG_SENT_MESSAGE_TOPIC_1)

    let noncesFound = 0;
    logs.forEach((event: EventRaw) => {
        const txHash = event.transactionHash;
        const depositInfo = depositsInfos.get(txHash);
        if (depositInfo) {
          depositInfo.nonce = parseDepositNonce(event);
          noncesFound++;
        }
      }
    )
    return noncesFound;
  }


  private async fillDepositFinalizedData(firstBlock: number, lastBlock: number, transactionsInfos: Map<TxHash, TransactionInfo>): Promise<Map<TxHash, TransactionInfo>> {
    const logs = await fetchLogs(this.bridgeConfig.l2.chainInfo, firstBlock, lastBlock, this.bridgeConfig.l2.addresses.bridgeAddress, LOG_DEPOSIT_FINALIZED_TOPIC_0)

    const finalizedTxHashes = logs.map((event: EventRaw) => event.transactionHash);

    const finalizedDeposits = new Map<Nonce, TransactionInfo>();

    logger.info(`Found ${finalizedTxHashes.length} finalized transactions`);

    for (let i = 0; i < finalizedTxHashes.length; i++) {
      const txHash = finalizedTxHashes[i];
      const transaction = transactionsInfos.get(txHash);
      if (transaction) {
        const tx = await fetchTransactionDetails(this.bridgeConfig.l2.chainInfo, txHash);
        const nonce: Nonce = parseDepositNonceFromTx(tx);
        finalizedDeposits.set(nonce, transaction);
      }
      if (i % 10 === 0)
        logger.debug(`txHash processed: ${i}/${finalizedTxHashes.length}`);
    }
    return finalizedDeposits;
  }

  private async updateDepositFinalizePrice(nonces: Nonce[]) {
    const deposits = await fetchDepositsFromNonces(nonces);
    logger.info(`Fetched ${deposits.size} deposits from DB to update price`);
    const {tokens, pricesFilled} = await fillPriceDataL2(this.bridgeConfig, deposits);
    logger.info(`Filled price for: ${pricesFilled} deposits. Found ${tokens.length} different tokens`);
    await storeDepositFinalizePrice(Array.from(deposits.values()));
    logger.info("Deposits stored")
    await storeTokensInfos(tokens);
    logger.info("Tokens stored")
  }
}
