(async () => {
  eval(await (await fetch('https://raw.githubusercontent.com/OpenAsar/arrpc/main/examples/bridge_mod.js')).text());
})();