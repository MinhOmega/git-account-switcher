import { useState } from "react";
import type {
  GitAccountPublic,
  GitAccountFormData,
  GitConfigState,
  AppSettings,
  GitHubCLIStatus,
  Result,
} from "../../shared/types";
import AccountCard from "./AccountCard";
import EmptyState from "./EmptyState";
import AddEditAccountModal from "./AddEditAccountModal";
import ConfirmDialog from "./ConfirmDialog";

interface MainWindowProps {
  accounts: GitAccountPublic[];
  activeAccount: GitAccountPublic | null;
  isSwitching: string | null;
  error: string | null;
  gitConfig: GitConfigState | null;
  settings: AppSettings;
  cliStatus: GitHubCLIStatus | null;
  onSwitchAccount: (id: string) => Promise<Result<null>>;
  onAddAccount: (data: GitAccountFormData) => Promise<Result<GitAccountPublic>>;
  onUpdateAccount: (data: GitAccountFormData) => Promise<Result<GitAccountPublic>>;
  onRemoveAccount: (id: string) => Promise<Result<null>>;
  onGetAccountForEdit: (id: string) => Promise<Result<GitAccountFormData>>;
  onOpenSettings: () => void;
  onClearError: () => void;
  onRefreshGitConfig: () => void;
  onOpenExternal: (url: string) => void;
  onCopyToClipboard: (text: string) => void;
  onQuit: () => void;
  rpc: any;
}

export default function MainWindow({
  accounts,
  activeAccount,
  isSwitching,
  error,
  gitConfig,
  settings,
  onSwitchAccount,
  onAddAccount,
  onUpdateAccount,
  onRemoveAccount,
  onGetAccountForEdit,
  onOpenSettings,
  onClearError,
  onRefreshGitConfig,
  onOpenExternal,
  onCopyToClipboard,
  onQuit,
}: MainWindowProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editAccountId, setEditAccountId] = useState<string | null>(null);
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);
  const deleteAccount = accounts.find((a) => a.id === deleteAccountId);

  return (
    <div className="h-screen flex flex-col bg-github-dark overflow-hidden">
      {/* Header - draggable title bar region */}
      <div className="glass-header flex items-center justify-between pl-[78px] pr-4 py-2.5 border-b border-github-dark-border/50 drag-region flex-shrink-0">
        <div className="flex items-center gap-2.5 no-drag">
          <div className="w-7 h-7 rounded-lg gradient-green flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xs font-semibold text-github-gray-light leading-tight">
              Git Account Switcher
            </h1>
            {activeAccount && (
              <p className="text-[10px] text-github-green leading-tight">
                {activeAccount.displayName}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 no-drag">
          <button
            onClick={() => setShowAddModal(true)}
            className="p-1.5 rounded-md text-github-gray hover:text-github-green hover:bg-github-green/10 transition-colors"
            title="Add Account"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
              <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z" />
            </svg>
          </button>
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-md text-github-gray hover:text-github-gray-light hover:bg-github-dark-border/50 transition-colors"
            title="Settings"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.3.071L12.7 2.82c.644-.18 1.344.04 1.734.588a8.16 8.16 0 0 1 .83 1.66c.222.611.016 1.3-.45 1.72l-.803.644c-.047.037-.09.118-.09.258 0 .14.043.22.09.258l.803.644c.466.42.672 1.109.45 1.72a8.16 8.16 0 0 1-.83 1.66c-.39.549-1.09.768-1.734.588l-1.072-.258a.364.364 0 0 0-.3.071 5.96 5.96 0 0 1-.668.386c-.133.066-.194.158-.212.224l-.288 1.107c-.17.645-.716 1.195-1.459 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.065-1.289-.615-1.459-1.26l-.289-1.107a.365.365 0 0 0-.211-.224 5.938 5.938 0 0 1-.668-.386.364.364 0 0 0-.301-.071l-1.071.258c-.645.18-1.345-.039-1.734-.588a8.16 8.16 0 0 1-.831-1.66c-.222-.611-.016-1.3.45-1.72l.803-.644c.047-.038.09-.118.09-.258 0-.14-.043-.22-.09-.258l-.803-.644c-.466-.42-.672-1.109-.45-1.72a8.16 8.16 0 0 1 .83-1.66c.39-.549 1.09-.768 1.734-.588l1.072.258c.067.019.177.011.3-.071.214-.143.437-.272.668-.386a.365.365 0 0 0 .212-.224l.288-1.107C6.01.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.072-.258c-.098-.024-.151.036-.179.075a6.69 6.69 0 0 0-.68 1.359c-.04.11.013.167.049.198l.802.643c.453.363.723.87.723 1.458 0 .588-.27 1.095-.723 1.458l-.802.643c-.036.03-.09.088-.049.198.09.255.2.5.332.733.14.245.327.47.349.497.028.039.081.099.179.075l1.072-.258c.56-.153 1.112-.008 1.528.27.16.107.328.204.501.29.449.222.851.628.998 1.189l.289 1.105c.029.11.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.072.258c.098.024.151-.036.179-.075.062-.088.133-.18.198-.276a6.6 6.6 0 0 0 .482-.874c.04-.11-.013-.167-.049-.198l-.803-.643c-.452-.363-.722-.87-.722-1.458 0-.588.27-1.095.722-1.458l.803-.643c.036-.03.09-.088.049-.198a6.69 6.69 0 0 0-.68-1.359c-.028-.039-.081-.099-.179-.075l-1.072.258c-.56.153-1.112.008-1.528-.27a4.44 4.44 0 0 0-.501-.29c-.449-.222-.851-.628-.998-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-red-400">{error}</span>
          <button
            onClick={onClearError}
            className="text-red-400 hover:text-red-300 ml-2"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
              <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
            </svg>
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {accounts.length === 0 ? (
          <EmptyState onAddAccount={() => setShowAddModal(true)} />
        ) : (
          <div className="p-3 space-y-2">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                isSwitching={isSwitching === account.id}
                onSwitch={() => onSwitchAccount(account.id)}
                onEdit={() => setEditAccountId(account.id)}
                onDelete={() => setDeleteAccountId(account.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="glass-footer flex items-center justify-between px-4 py-2 border-t border-github-dark-border/50 flex-shrink-0">
        <div className="text-[10px] text-github-gray-dark truncate">
          {gitConfig?.userEmail ? (
            <span>
              <span className="text-github-gray">{gitConfig.userName}</span>
              {" "}
              <span className="text-github-gray-dark">&lt;{gitConfig.userEmail}&gt;</span>
            </span>
          ) : (
            "No git config set"
          )}
        </div>
        <button
          onClick={onRefreshGitConfig}
          className="p-1 rounded text-github-gray-dark hover:text-github-gray transition-colors"
          title="Refresh"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
            <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z" />
          </svg>
        </button>
      </div>

      {/* Modals */}
      <AddEditAccountModal
        isOpen={showAddModal || editAccountId !== null}
        editAccountId={editAccountId}
        onClose={() => {
          setShowAddModal(false);
          setEditAccountId(null);
        }}
        onSave={async (data) => {
          if (editAccountId) {
            return onUpdateAccount({ ...data, id: editAccountId });
          }
          return onAddAccount(data);
        }}
        onGetAccountForEdit={onGetAccountForEdit}
        onOpenExternal={onOpenExternal}
      />

      <ConfirmDialog
        isOpen={deleteAccountId !== null}
        title="Delete Account"
        message={`Are you sure you want to delete "${deleteAccount?.displayName || ""}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
          if (deleteAccountId) {
            await onRemoveAccount(deleteAccountId);
            setDeleteAccountId(null);
          }
        }}
        onCancel={() => setDeleteAccountId(null)}
      />
    </div>
  );
}
