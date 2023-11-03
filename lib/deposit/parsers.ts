import {EventRaw, Nonce} from "@/lib/types";
// TODO parse this properly using logs ABI's and so


export function parseDepositErc20InitializedLog(event: EventRaw) {
  return {
    l1Token: '0x' + event.topics[1].slice(26),
    l2Token: '0x' + event.topics[2].slice(26),
    from: '0x' + event.topics[3].slice(26),
    to: '0x' + event.data.slice(26, 66),
    amount: BigInt('0x' + event.data.slice(90,130)).toString()
  }
}

export function parseDepositEthInitializedLog(event: EventRaw) {
  return {
    from: '0x' + event.topics[1].slice(26),
    to: '0x' + event.topics[2].slice(26),
    amount: BigInt('0x' + event.data.slice(2,66)).toString()
  }
}

export function parseDepositNonceFromTx(tx: {input: string}): Nonce {
  return tx.input.slice(10,74);
}

export function parseDepositNonce(event: EventRaw) {
  return event.data.slice(130, 194);
}