import type { ElectrobunConfig } from "electrobun";

export default {
  app: {
    name: "Git Account Switcher",
    identifier: "dev.gitaccountswitcher.app",
    version: "1.2.1",
    description: "Switch between multiple GitHub accounts with one click",
  },
  build: {
    copy: {
      "dist/index.html": "views/mainview/index.html",
      "dist/assets": "views/mainview/assets",
    },
    watchIgnore: ["dist/**"],
    mac: {
      bundleCEF: false,
    },
    linux: {
      bundleCEF: false,
    },
    win: {
      bundleCEF: false,
    },
  },
  runtime: {
    exitOnLastWindowClosed: false,
  },
} satisfies ElectrobunConfig;
