export const createScanRunner = scan => {
  let running = false;

  return async () => {
    if (running) return false;

    running = true;
    try {
      await scan();
      return true;
    } finally {
      running = false;
    }
  };
};
