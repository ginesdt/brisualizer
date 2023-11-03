import {
  BridgeConfig,
  EventRaw,
  OperationType,
  TransactionInfo,
  TxHash,
  WithdrawalHash,
  WithdrawInfo,
  WithdrawStatus
} from "@/lib/types";
import {fetchLogs, fetchTransactions} from "@/lib/commons/tx-info";
import {
  FINALIZE_WITHDRAW_TRANSACTION_METHOD_HASH,
  PROVE_WITHDRAW_TRANSACTION_METHOD_HASH,
  WITHDRAW_METHOD_HASH,
  LOG_MESSAGE_PASSED_TOPIC_0,
  LOG_WITHDRAW_INITIALIZED_TOPIC_0,
  LOG_WITHDRAWAL_FINALIZED_TOPIC_0,
  LOG_WITHDRAWAL_PROVEN_TOPIC_0
} from "@/lib/constants";
import {fetchFirstBlock, storeLastBlock, storeTokensInfos} from "@/lib/commons/db-manager";
import {
  parseFinalizedWithdrawalHash,
  parseProvenWithdrawalHash, parseWithdrawalHash,
  parseWithdrawInitializedLog, parseWithdrawNonce
} from "@/lib/withdraw/parsers";
import {
  fetchWithdrawsFromHashes,
  storeWithdrawData,
  storeWithdrawFinalizePrice,
  updateWithdrawStatuses
} from "@/lib/withdraw/db-manager";
import {fillPriceDataL1, fillPriceDataL2} from "@/lib/commons/prices";
import {logger} from "../../logger";

interface IWithdrawCollector {
  updateWithdraws: () => Promise<{initializedWithdraws: number, provedWithdraws: number, finalizedWithdraws: number}>
}

export class WithdrawCollector implements IWithdrawCollector {
  private readonly bridgeConfig: BridgeConfig;

  constructor(bridgeConfig: BridgeConfig) {
    this.bridgeConfig = bridgeConfig;
  }

  public async updateWithdraws(): Promise<{initializedWithdraws: number, provedWithdraws: number, finalizedWithdraws: number}> {
    const l1Info = await this.updateWithdrawsFromL2();
    const l2Info = await this.updateWithdrawsFromL1()
    return {...l1Info, ...l2Info}
  }

  private async updateWithdrawsFromL2() : Promise<{ initializedWithdraws: number }>  {
    logger.info(`Start updating withdraws info from L2 ${this.bridgeConfig.l2.chainInfo.name} (L1: ${this.bridgeConfig.l1.chainInfo.name})`);
    const firstBlock = await fetchFirstBlock(this.bridgeConfig.l2.chainInfo, this.bridgeConfig.l1.chainInfo, OperationType.Withdraw);
    logger.info(`Updating withdraws from block: ${firstBlock}`);

    const {transactionsInfos, lastBlock} =
      await fetchTransactions(
        firstBlock,
        this.bridgeConfig.l2.chainInfo,
        this.bridgeConfig.l2.addresses.bridgeAddress,
        [WITHDRAW_METHOD_HASH]);
    logger.info(`Found: ${transactionsInfos.size} withdraw initialize transactions, until block: ${lastBlock}`);

    transactionsInfos.forEach((ti) => ti.transitionedTo = WithdrawStatus.Initialized);

    if (transactionsInfos.size > 0 && lastBlock) {
      const withdraws: Map<TxHash, WithdrawInfo> = await this.createWithdrawInitData(firstBlock, lastBlock, transactionsInfos);
      logger.info(`Found initialized data for: ${withdraws.size} transactions`);
      const withdrawHashesFound = await this.fillWithdrawMessageData(firstBlock, lastBlock, withdraws);
      logger.info(`Filled withdrawHash for: ${withdrawHashesFound} transactions`);
      const {tokens, pricesFilled} = await fillPriceDataL2(this.bridgeConfig, withdraws);
      logger.info(`Filled price for: ${pricesFilled} transactions. Found ${tokens.length} different tokens`);

      await storeWithdrawData(withdraws);
      logger.info("Withdraw stored")
      await storeTokensInfos(tokens);
      logger.info("Tokens stored")
      await storeLastBlock(this.bridgeConfig.l2.chainInfo.chainId, this.bridgeConfig.l1.chainInfo.chainId, lastBlock, OperationType.Withdraw);
      logger.info(`Last block stored for chain: ${this.bridgeConfig.l2.chainInfo.chainId}, lastBlock: ${lastBlock}, operation: ${OperationType.Withdraw}`)
    }
    return {initializedWithdraws: transactionsInfos.size};
  }

  private async updateWithdrawsFromL1() : Promise<{ provedWithdraws: number, finalizedWithdraws: number }>  {
    logger.info(`Start update withdraws info from L1 ${this.bridgeConfig.l1.chainInfo.name} (L2: ${this.bridgeConfig.l2.chainInfo.name})`);
    const firstBlock = await fetchFirstBlock(this.bridgeConfig.l1.chainInfo, this.bridgeConfig.l2.chainInfo, OperationType.Withdraw);
    logger.info(`Updating withdraws from block: ${firstBlock}`);

    const {transactionsInfos, lastBlock}: { lastBlock: number | undefined; transactionsInfos: Map<TxHash, TransactionInfo> } =
      await fetchTransactions(
        firstBlock,
        this.bridgeConfig.l1.chainInfo,
        this.bridgeConfig.l1.addresses.portalAddress,
        [PROVE_WITHDRAW_TRANSACTION_METHOD_HASH, FINALIZE_WITHDRAW_TRANSACTION_METHOD_HASH]);
    logger.info(`Found: ${transactionsInfos.size} withdraw proven/finalized transactions, until block: ${lastBlock}`);

    if (transactionsInfos.size > 0 && lastBlock) {
      const provedWithdraws: Map<TxHash, TransactionInfo> = await this.fillProvenData(firstBlock, lastBlock, transactionsInfos);
      logger.info(`Found proven data for: ${provedWithdraws.size} withdraws`);
      if (provedWithdraws.size > 0) {
        await updateWithdrawStatuses(provedWithdraws, WithdrawStatus.Proven);
      }

      const finalizedWithdraws = await this.fillWithdrawFinalizedData(firstBlock, lastBlock, transactionsInfos);
      logger.info(`Found finalized data for: ${provedWithdraws.size} withdraws`);
      if (finalizedWithdraws.size > 0) {
        await updateWithdrawStatuses(finalizedWithdraws, WithdrawStatus.Finalized);
        await this.updateWithdrawFinalizePrice(Array.from(finalizedWithdraws.keys()));
      }

      await storeLastBlock(this.bridgeConfig.l1.chainInfo.chainId, this.bridgeConfig.l2.chainInfo.chainId, lastBlock, OperationType.Withdraw);
      logger.info(`Last block stored for chain: ${this.bridgeConfig.l1.chainInfo.chainId}, lastBlock: ${lastBlock}, operation: ${OperationType.Withdraw}`)
      return {provedWithdraws: provedWithdraws.size, finalizedWithdraws: finalizedWithdraws.size};
    }
    return {provedWithdraws: 0, finalizedWithdraws: 0};
  }

  private async fillWithdrawL1Data(firstBlock: number, lastBlock: number, transactionsInfos: Map<WithdrawalHash, TransactionInfo>,
                                   topic0: string, parseWithdrawFn: (e: EventRaw) => WithdrawalHash): Promise<Map<WithdrawalHash, TransactionInfo>> {
    const logs = await fetchLogs(this.bridgeConfig.l1.chainInfo, firstBlock, lastBlock, this.bridgeConfig.l1.addresses.portalAddress, topic0)

    const withdraws: [WithdrawalHash, TransactionInfo][] = logs.map((event: EventRaw): [WithdrawalHash, TransactionInfo] | undefined => {
      const txHash = event.transactionHash;
      const transactionInfo = transactionsInfos.get(txHash);
      if (transactionInfo) {
        return [parseWithdrawFn(event), transactionInfo];
      }
    }).filter((r: [WithdrawalHash, TransactionInfo] | undefined) => r) as [WithdrawalHash, TransactionInfo][]

    return new Map(withdraws);
  }

  private async fillProvenData(firstBlock: number, lastBlock: number, transactionsInfos: Map<TxHash, TransactionInfo>): Promise<Map<TxHash, TransactionInfo>> {
    return this.fillWithdrawL1Data(firstBlock, lastBlock, transactionsInfos, LOG_WITHDRAWAL_PROVEN_TOPIC_0, parseProvenWithdrawalHash);
  }

  private async fillWithdrawFinalizedData(firstBlock: number, lastBlock: number, transactionsInfos: Map<TxHash, TransactionInfo>): Promise<Map<WithdrawalHash, TransactionInfo>> {
    return this.fillWithdrawL1Data(firstBlock, lastBlock, transactionsInfos, LOG_WITHDRAWAL_FINALIZED_TOPIC_0, parseFinalizedWithdrawalHash);
  }

  private async updateWithdrawFinalizePrice(withdrawHashes: WithdrawalHash[]) {
    const withdraws = await fetchWithdrawsFromHashes(withdrawHashes);
    logger.info(`Fetched ${withdraws.size} withdraws from DB to update price`);
    const {tokens, pricesFilled} = await fillPriceDataL1(this.bridgeConfig, withdraws);
    logger.info(`Filled price for: ${pricesFilled} withdraws. Found ${tokens.length} different tokens`);
    await storeWithdrawFinalizePrice(Array.from(withdraws.values()));
    logger.info("Deposits stored")
    await storeTokensInfos(tokens);
    logger.info("Tokens stored")
  }

  private async createWithdrawInitData(firstBlock: number, lastBlock: number, transactionsInfos: Map<TxHash, TransactionInfo>): Promise<Map<TxHash, WithdrawInfo>> {
    const logs = await fetchLogs(this.bridgeConfig.l2.chainInfo, firstBlock, lastBlock, this.bridgeConfig.l2.addresses.bridgeAddress, LOG_WITHDRAW_INITIALIZED_TOPIC_0)

    return new Map(logs.map((event: EventRaw): [TxHash, WithdrawInfo] | undefined => {
      const txHash = event.transactionHash;
      const transactionInfo = transactionsInfos.get(txHash);
      if (transactionInfo) {
        const withdrawInitializedLog = parseWithdrawInitializedLog(event);
        return [txHash, {
          l1Token: withdrawInitializedLog.l1Token,
          l2Token: withdrawInitializedLog.l2Token,
          from: withdrawInitializedLog.from,
          to: withdrawInitializedLog.to,
          amount: withdrawInitializedLog.amount,
          status: WithdrawStatus.Initialized,
          chain: this.bridgeConfig.l2.chainInfo.chainId,
          transactions: [transactionInfo]
        }]
      }
    }).filter((r: [TxHash, WithdrawInfo] | undefined) => r) as [string, WithdrawInfo][]);
  }

  private async fillWithdrawMessageData(firstBlock: number, lastBlock: number, withdrawsInfos: Map<TxHash, WithdrawInfo>): Promise<number> {
    const logs = await fetchLogs(this.bridgeConfig.l2.chainInfo, firstBlock, lastBlock, this.bridgeConfig.l2.addresses.l2Tol1MessagePasser, LOG_MESSAGE_PASSED_TOPIC_0)

    let withdrawHashesFound = 0;

    logs.forEach((event: EventRaw) => {
        const txHash = event.transactionHash;
        const withdrawInfo = withdrawsInfos.get(txHash);
        if (withdrawInfo) {
          withdrawInfo.withdrawalHash = parseWithdrawalHash(event);
          withdrawInfo.nonce = parseWithdrawNonce(event);
          withdrawHashesFound++;
        }
      }
    )
    return withdrawHashesFound;
  }

}
