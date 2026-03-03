import { useState, useEffect, useCallback } from "react";
import type {
  GitAccountPublic,
  GitAccountFormData,
  Result,
} from "../../shared/types";
import { useRPCRequest } from "./useRPC";

export function useAccounts() {
  const rpc = useRPCRequest();
  const [accounts, setAccounts] = useState<GitAccountPublic[]>([]);
  const [activeAccount, setActiveAccount] = useState<GitAccountPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [accts, active] = await Promise.all([
        rpc.getAccounts({}),
        rpc.getActiveAccount({}),
      ]);
      setAccounts(accts);
      setActiveAccount(active);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load accounts");
    } finally {
      setIsLoading(false);
    }
  }, [rpc]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addAccount = useCallback(
    async (data: GitAccountFormData): Promise<Result<GitAccountPublic>> => {
      const result = await rpc.addAccount({ account: data });
      if (result.success) await refresh();
      return result;
    },
    [rpc, refresh],
  );

  const updateAccount = useCallback(
    async (data: GitAccountFormData): Promise<Result<GitAccountPublic>> => {
      const result = await rpc.updateAccount({ account: data });
      if (result.success) await refresh();
      return result;
    },
    [rpc, refresh],
  );

  const removeAccount = useCallback(
    async (accountId: string): Promise<Result<null>> => {
      const result = await rpc.removeAccount({ accountId });
      if (result.success) await refresh();
      return result;
    },
    [rpc, refresh],
  );

  const switchToAccount = useCallback(
    async (accountId: string): Promise<Result<null>> => {
      setIsSwitching(accountId);
      setError(null);
      try {
        const result = await rpc.switchToAccount({ accountId });
        if (result.success) {
          await refresh();
        } else {
          setError(result.error);
        }
        return result;
      } finally {
        setIsSwitching(null);
      }
    },
    [rpc, refresh],
  );

  const getAccountForEdit = useCallback(
    async (accountId: string) => {
      return rpc.getAccountForEdit({ accountId });
    },
    [rpc],
  );

  return {
    accounts,
    activeAccount,
    isLoading,
    isSwitching,
    error,
    setError,
    addAccount,
    updateAccount,
    removeAccount,
    switchToAccount,
    getAccountForEdit,
    refresh,
  };
}
