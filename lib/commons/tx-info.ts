import {
  ChainInfo,
  EventRaw,
  TokenAddress,
  TokenWithAmount,
  TransactionInfo,
  TxHash,
} from "@/lib/types";
import {Decommas, TToken, TTransaction} from "@decommas/sdk";
import {
  DECOMMAS_API_KEY,
  DECOMMAS_PAG_SIZE,
  ETHERSCAN_PAG_SIZE
} from "@/lib/constants";
import {logger} from "../../logger";

function sleep (timeMs: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeMs);
  });
}

async function fetchWithRetry<ResultType>(fn: () => ResultType, maxAttempts = 10, isReachLimitError: (result: ResultType) => boolean = () => false): Promise<ResultType> {
  let attempts = 0;
  while (true) {
    try {
      const result = await fn();
      if (isReachLimitError(result)) {
        attempts++;
        continue;
      }
      return result;
    } catch (error) {
      if (attempts < maxAttempts && typeof error === 'object' && error !== null && 'status' in error && error.status === 429) {
        attempts++;
        await sleep(500 * attempts);
        continue;
      }
      throw error;
    }
  }
}

export async function fetchTransactions(firstBlock: number, chainInfo: ChainInfo, contractAddress: string, methodsHashes: string[]) {
  const decommas = new Decommas(DECOMMAS_API_KEY);
  const transactionsInfos = new Map<TxHash, TransactionInfo>();
  let oldestBlock : number;
  let newestBlock : number | undefined;
  let offset: number = 0;
  let transactions;
  do {
    transactions = await fetchWithRetry(() =>
      decommas.address.getTransactions({
        chains: [chainInfo.name],
        address: contractAddress,
        offset: offset,
        limit: DECOMMAS_PAG_SIZE
      }));

    if (offset === 0)
      newestBlock = transactions.result.at(0)?.blockNumber;

    oldestBlock = transactions.result[transactions.result.length - 1].blockNumber;

    transactions.result
      .filter(t => t.status === true
        && t.toAddress.toLowerCase() === contractAddress.toLowerCase()
        && methodsHashes.includes(t.methodHash)
        && t.blockNumber > firstBlock)
      .map((t: TTransaction): TransactionInfo => {
        return {
          chain: chainInfo.chainId,
          txHash: t.hash,
          txFrom: t.fromAddress,
          txTo: t.toAddress,
          block: t.blockNumber,
          timestamp: t.blockTimestamp
        }
      })
      .forEach(ti => transactionsInfos.set(ti.txHash, ti))

    offset += DECOMMAS_PAG_SIZE;
  } while (firstBlock <= oldestBlock && transactions.result.length !== 0);

  return {transactionsInfos, lastBlock: newestBlock};
}

export async function fetchLogs(chainInfo: ChainInfo, firstBlock: number, lastBlock: number, address: string, topic0: string|undefined, topic1: string|undefined = undefined) {
  let allLogs: EventRaw[] = []
  let page = 1
  let result
  do {
    const response = await
      fetchWithRetry(() =>
          fetch(`${chainInfo.etherscanApiUrl}?module=logs&action=getLogs&fromBlock=${firstBlock}&toBlock=${lastBlock}&address=${address}&topic0=${topic0}${topic1?"&topic0_1_opr=and&topic1="+topic1:""}&page=${page}&offset=${ETHERSCAN_PAG_SIZE}&apikey=${chainInfo.etherscanApiKey}`),
        undefined, checkEtherscanLimit);
    const responseJson = await response.json();
    result = responseJson.result;
    allLogs = allLogs.concat(result);
    page++;
    if (page > 10) {
      page = 1;
      firstBlock = parseInt(responseJson.result[responseJson.result.length - 1].blockNumber);
      logger.debug(`pagination limit. Increasing firstBlock to: ${firstBlock}, lastBlock: ${lastBlock}`)
    }
  } while (result.length === ETHERSCAN_PAG_SIZE)

  // remove possible duplicates due to pagination
  return allLogs.filter((event, index) => allLogs.findIndex((other) => event.transactionHash === other.transactionHash && event.transactionIndex === event.transactionIndex) === index);
}

export async function fetchTransactionDetails(chainInfo: ChainInfo, txHash: string) {
  const responseJson = await fetchWithRetry(async ()  => {
    const response = await fetch(`${chainInfo.etherscanApiUrl}?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${chainInfo.etherscanApiKey}`);
    return await response.json();
  }, undefined, checkEtherscanLimit)
  return responseJson.result;
}

export async function getNativeCoinPrice(chainInfo: ChainInfo) {
  const responseJson = await fetchWithRetry(async ()  => {
    const response = await fetch(`${chainInfo.etherscanApiUrl}?module=stats&action=ethprice&apikey=${chainInfo.etherscanApiKey}`);
    return await response.json();
  }, undefined, checkEtherscanLimit)

  return responseJson.result.ethusd;
}

export async function fetchTokensPrice(chainInfo: ChainInfo, tokensAdresses: TokenAddress[]): Promise<Map<TokenAddress, TToken>> {
  const decommas = new Decommas(DECOMMAS_API_KEY);
  const tokens = new Map<string, TToken>();
  for (const token of tokensAdresses) {
    try {
      const tokenInfo = await fetchWithRetry(() => {
        return decommas.metadata.getToken({
          chainName: chainInfo.name,
          contractAddress: token
        })
      })
      tokens.set(token, tokenInfo);
    } catch (error) {
      logger.warn(`Failed to get token info for ${token} in ${chainInfo.name}`);
    }
  }
  return tokens;
}

function checkEtherscanLimit(response: any) {
  return response.status === "0" && typeof response.result === "string" && response.result.includes("Max rate limit reached");
}

export async function fetchTokens(chainInfo: ChainInfo, address: string): Promise<TokenWithAmount[]> {
  const decommas = new Decommas(DECOMMAS_API_KEY);

  let allTokens: TokenWithAmount[] = [];
  let offset: number = 0;
  let tokensResponse;

  do {
    tokensResponse = await fetchWithRetry(() => decommas.address.getTokens({
      chains: [chainInfo.name],
      address: address,
      offset: offset,
      limit: DECOMMAS_PAG_SIZE
    }));

    allTokens = allTokens.concat(tokensResponse.result.map((token) : TokenWithAmount => {return {
      chain: token.chainId,
      address: token.address,
      name: token.name,
      decimals: token.decimals,
      symbol: token.symbol,
      logoUrl: token.logoUrl,
      verified: token.isVerified,
      stable: token.isStable,
      amount: token.amount,
      price: token.actualPrice
    }}));

    offset += DECOMMAS_PAG_SIZE;

  } while (tokensResponse.result.length === DECOMMAS_PAG_SIZE)

  return allTokens;
}

export async function fetchNativeCoin(chainInfo: ChainInfo, address: string): Promise<{amount: string, price: string}|undefined> {
  const decommas = new Decommas(DECOMMAS_API_KEY);

  const coinsResponse = await fetchWithRetry(() => decommas.address.getCoins({
    chains: [chainInfo.name],
    address: address
  }));
  const coin = coinsResponse.result.at(0);
  if (coin)
    return {amount: coin.amount, price: coin.actualPrice}
}