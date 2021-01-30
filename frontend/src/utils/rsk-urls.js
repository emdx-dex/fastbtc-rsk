const RSK_EXPLORER_URL = process.env.VUE_APP_RSK_EXPLORER_URL

export const getAddressUrl = (address) => {
  return `${RSK_EXPLORER_URL}/address/${address}/`;
} 

export const getTxUrl = (tx) => {
  return `${RSK_EXPLORER_URL}/tx/${tx}/`;
}
