import {EvmChainId, EvmChainName} from "@decommas/sdk";

export enum WithdrawStatus {
  Initialized,
  Proven,
  Finalized
}

export enum DepositStatus {
  Initialized,
  Finalized
}

export enum OperationType {
  Withdraw,
  Deposit
}

export type WithdrawInfo = {
  chain: number,
  status: WithdrawStatus,
  from: string,
  to: string,
  l1Token: string,
  l2Token: string,
  amount: string,
  withdrawalHash?: string
  nonce?: string
  transactions?: TransactionInfo[]
  l1Price?: number,
  l2Price?: number,
}

export type DepositInfo = {
  chain: number,
  status: DepositStatus,
  from: string,
  to: string,
  l1Token: string,
  l2Token: string,
  amount: string,
  nonce?: string
  transactions?: TransactionInfo[]
  l1Price?: number,
  l2Price?: number,
}

export type TransactionInfo = {
  txHash: string,
  chain: number,
  txFrom: string,
  txTo: string,
  block: number,
  timestamp: number,
  transitionedTo?: WithdrawStatus | DepositStatus
}


export type TxHash = string
export type WithdrawalHash = string
export type Nonce = string
export type TokenAddress = string

export type EventRaw = {
  address: string
  topics: string[]
  data: string
  blockNumber: string
  blockHash: string
  timeStamp : string
  gasPrice: string
  gasUsed: string
  longIndex: string
  transactionHash: string
  transactionIndex: string
}

export type WithdrawInitializedLog = {
  l1Token: string,
  l2Token: string,
  from: string,
  to: string,
  amount: string,
  extraData?: string
}

export type ChainInfo = {
  name: EvmChainName,
  chainId: EvmChainId,
  defaultFirstBlock: number,
  etherscanApiKey: string,
  etherscanApiUrl: string
}

export type Token = {
  chain: number
  address: string
  name: string
  decimals: number
  symbol: string
  logoUrl: string
  verified: boolean
  stable: boolean
  price: string
}

export type TokenWithAmount = Token & {amount: string}

export type BridgeInfo = {
  chain: number
  chainName: string
  tokens: TokenHoldingInfo[]
  addresses: BridgeAddressInfo[]
  nativeCoinAmount: string
  nativeCoinPrice: string
}

export type TokenHoldingInfo = {
  token:  Token
  amount: string
}

export type BridgeAddressInfo = {
  chain: number,
  address: string,
  name: string
}

export type BridgeConfig = {
  l1: {
    chainInfo: ChainInfo,
    addresses: L1Addresses,
  },
  l2: {
    chainInfo: ChainInfo,
    addresses: L2Addresses,
  }
}

export type L1Addresses = {
  bridgeAddress: string,
  portalAddress: string,
  crossDomainMessenger: string
}

export type L2Addresses = {
  bridgeAddress: string,
  l2Tol1MessagePasser: string,
  crossDomainMessenger: string,
  ethTokenAddress: string,
  wrappedEthTokenAddress: string
}
