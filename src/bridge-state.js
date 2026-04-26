export const createBridgeState = () => {
  const messages = new Map();

  return {
    update(msg) {
      if (msg.socketId == null) return;

      const socketId = msg.socketId.toString();
      if (msg.activity == null) {
        messages.delete(socketId);
        return;
      }

      messages.set(socketId, msg);
    },

    replayable() {
      return Array.from(messages.values());
    },

    get size() {
      return messages.size;
    }
  };
};
