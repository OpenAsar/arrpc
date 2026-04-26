export const MAX_BRIDGE_BUFFERED_AMOUNT = 1024 * 1024;

export const sendToBridgeClients = (clients, msg, {
  maxBufferedAmount = MAX_BRIDGE_BUFFERED_AMOUNT,
  openState,
  stringify = JSON.stringify
} = {}) => {
  const payload = stringify(msg);

  for (const client of clients) {
    if (openState != null && client.readyState !== openState) continue;

    if (client.bufferedAmount > maxBufferedAmount) {
      client.terminate?.();
      continue;
    }

    client.send(payload);
  }
};
