import { Electroview } from "electrobun/view";
import type { MainViewRPC } from "../../shared/rpc-types";

let electroviewInstance: any = null;

export function initializeRPC() {
  if (electroviewInstance) return electroviewInstance;

  const rpc = Electroview.defineRPC<MainViewRPC>({
    handlers: {
      requests: {},
      messages: {
        accountsUpdated: () => {},
        activeAccountChanged: () => {},
        gitConfigUpdated: () => {},
        switchStarted: () => {},
        switchCompleted: () => {},
        settingsUpdated: () => {},
      },
    },
  });

  electroviewInstance = new Electroview({ rpc });
  return electroviewInstance;
}

export function getRPC() {
  if (!electroviewInstance) {
    initializeRPC();
  }
  return electroviewInstance!;
}

// Re-export the RPC request interface for convenience
export function useRPCRequest() {
  const ev = getRPC();
  return ev.rpc!.request;
}

export function useRPCSend() {
  const ev = getRPC();
  return ev.rpc!.send;
}
