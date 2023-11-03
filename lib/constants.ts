import {EvmChainId, EvmChainName} from "@decommas/sdk";

export const DECOMMAS_PAG_SIZE = 100;
export const ETHERSCAN_PAG_SIZE = 1000;

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;
export const DEFAULT_OFFSET = 0;

export const AUTO_REFRESH_MS = 60_000;


export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// TODO move this to some global config file
export const CHAINS = {
  MAINNET: {
    chainId: EvmChainId.MAINNET,
    name: EvmChainName.MAINNET,
    defaultFirstBlock: 18200000,
    etherscanApiKey: process.env.MAINNET_ETHERSCAN_API_KEY as string,
    etherscanApiUrl: "https://api.etherscan.io/api",
    transactionUrl: "https://etherscan.io/tx/",
    addressUrl: "https://etherscan.io/address/",
    tokenUrl: "https://etherscan.io/token/"
  },
  OPTIMISM: {
    chainId: EvmChainId.OPTIMISM,
    name: EvmChainName.OPTIMISM,
    defaultFirstBlock: 110000000,
    etherscanApiKey: process.env.OPTIMISM_ETHERSCAN_API_KEY as string,
    etherscanApiUrl: "https://api-optimistic.etherscan.io/api",
    transactionUrl: "https://optimistic.etherscan.io/tx/",
    addressUrl: "https://optimistic.etherscan.io/address/",
    tokenUrl: "https://optimistic.etherscan.io/token/"
  },
  BASE: {
    chainId: EvmChainId.BASE,
    name: EvmChainName.BASE,
    defaultFirstBlock: 4500000,
    etherscanApiKey: process.env.BASE_ETHERSCAN_API_KEY as string,
    etherscanApiUrl: "https://api.basescan.org/api",
    transactionUrl: "https://basescan.org/tx/",
    addressUrl: "https://basescan.org/address/",
    tokenUrl: "https://basescan.org/token/"
  }
}

export const DECOMMAS_API_KEY = process.env.DECOMMAS_API_KEY as string

export const Addresses = {
  OPTIMISM: {
    l1: {
      bridgeAddress: "0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1",
      portalAddress: "0xbeb5fc579115071764c7423a4f12edde41f106ed",
      crossDomainMessenger: "0x25ace71c97b33cc4729cf772ae268934f7ab5fa1"
    },
    l2: {
      bridgeAddress: "0x4200000000000000000000000000000000000010",
      l2Tol1MessagePasser: "0x4200000000000000000000000000000000000016",
      crossDomainMessenger: "0x4200000000000000000000000000000000000007",
      ethTokenAddress: ZERO_ADDRESS,
      wrappedEthTokenAddress: "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000"
    }
  },
  BASE: {
    l1: {
      bridgeAddress: "0x3154Cf16ccdb4C6d922629664174b904d80F2C35",
      portalAddress: "0x49048044D57e1C92A77f79988d21Fa8fAF74E97e",
      crossDomainMessenger: "0x866E82a600A1414e583f7F13623F1aC5d58b0Afa"
    },
    l2: {
      bridgeAddress: "0x4200000000000000000000000000000000000010",
      l2Tol1MessagePasser: "0x4200000000000000000000000000000000000016",
      crossDomainMessenger: "0x4200000000000000000000000000000000000007",
      ethTokenAddress: ZERO_ADDRESS,
      wrappedEthTokenAddress: "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000"
    }
  },
}

export const bridgeConfigs = [
  {
    l1: {
      chainInfo: CHAINS.MAINNET,
      addresses: Addresses.OPTIMISM.l1
    },
    l2: {
      chainInfo: CHAINS.OPTIMISM,
      addresses: Addresses.OPTIMISM.l2
    }
  },
  {
    l1: {
      chainInfo: CHAINS.MAINNET,
      addresses: Addresses.BASE.l1
    },
    l2: {
      chainInfo: CHAINS.BASE,
      addresses: Addresses.BASE.l2
    }
  },
]

// L2
export const WITHDRAW_METHOD_HASH = "0x32b7006d";  // withdraw
export const LOG_MESSAGE_PASSED_TOPIC_0 = "0x02a52367d10742d8032712c1bb8e0144ff1ec5ffda1ed7d70bb05a2744955054";
export const LOG_WITHDRAW_INITIALIZED_TOPIC_0 = "0x73d170910aba9e6d50b102db522b1dbcd796216f5128b445aa2135272886497e";
export const LOG_DEPOSIT_FINALIZED_TOPIC_0 = "0xb0444523268717a02698be47d0803aa7468c00acbed2f8bd93a0459cde61dd89";

// L1
export const PROVE_WITHDRAW_TRANSACTION_METHOD_HASH = "0x4870496f"; // proveWithdrawalTransaction
export const FINALIZE_WITHDRAW_TRANSACTION_METHOD_HASH = "0x8c3152e9"; // finalizeWithdrawalTransaction
export const DEPOSIT_ERC20_METHOD_HASH = "0x58a997f6"; // depositERC20
export const DEPOSIT_ERC20_TO_METHOD_HASH = "0x838b2520"; // depositERC20To
export const DEPOSIT_ETH_METHOD_HASH = "0xb1a1a882"; // depositEth
export const DEPOSIT_ETH_TO_METHOD_HASH = "0x9a2ac6d5"; // depositEthTo
export const RELAY_MESSAGE_METHOD_HASH = "0xd764ad0b";

export const LOG_WITHDRAWAL_PROVEN_TOPIC_0 = "0x67a6208cfcc0801d50f6cbe764733f4fddf66ac0b04442061a8a8c0cb6b63f62";
export const LOG_WITHDRAWAL_FINALIZED_TOPIC_0 = "0xdb5c7652857aa163daadd670e116628fb42e869d8ac4251ef8971d9e5727df1b";
export const LOG_ERC20_DEPOSIT_INITIALIZED_TOPIC_0 = "0x718594027abd4eaed59f95162563e0cc6d0e8d5b86b1c7be8b1b0ac3343d0396";
export const LOG_ETH_DEPOSIT_INITIALIZED_TOPIC_0 = "0x35d79ab81f2b2017e19afb5c5571778877782d7a8786f5907f93b0f4702f4f23";
export const LOG_SENT_MESSAGE_TOPIC_0 = "0xcb0f7ffd78f9aee47a248fae8db181db6eee833039123e026dcbff529522e52a";
export const LOG_SENT_MESSAGE_TOPIC_1 = "0x0000000000000000000000004200000000000000000000000000000000000010";

