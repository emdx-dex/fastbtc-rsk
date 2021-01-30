const BTC_EXPLORER_URL = process.env.VUE_APP_BTC_EXPLORER_URL

export const getAddressUrl = (address) => {
  return `${BTC_EXPLORER_URL}/address/${address}/`;
} 

export const getTxUrl = (tx) => {
  return `${BTC_EXPLORER_URL}/tx/${tx}/`;
}
