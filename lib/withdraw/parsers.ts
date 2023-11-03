import {EventRaw, WithdrawalHash, WithdrawInitializedLog} from "@/lib/types";
// TODO parse this properly using logs ABI's and so

export function parseWithdrawalHash(event: EventRaw){
  return '0x' + event.data.slice(194, 258);
}

export function parseProvenWithdrawalHash(event: EventRaw): WithdrawalHash{
  return event.topics.at(1) as string;
}

export function parseFinalizedWithdrawalHash(event: EventRaw): WithdrawalHash{
  return event.topics.at(1) as string;
}

export function parseWithdrawNonce(event: EventRaw) {
  return event.topics[1];
}


export function parseWithdrawInitializedLog(event: EventRaw) : WithdrawInitializedLog {
  return {
    l1Token: '0x' + event.topics[1].slice(26),
    l2Token: '0x' + event.topics[2].slice(26),
    from: '0x' + event.topics[3].slice(26),
    to: '0x' + event.data.slice(26, 66),
    amount: BigInt('0x' + event.data.slice(90,130)).toString()
  }
}