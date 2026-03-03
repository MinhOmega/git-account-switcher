interface EmptyStateProps {
  onAddAccount: () => void;
}

export default function EmptyState({ onAddAccount }: EmptyStateProps) {
  const features = [
    { icon: "M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z", label: "Switch accounts instantly" },
    { icon: "M4 4v2h-.25A1.75 1.75 0 0 0 2 7.75v5.5c0 .966.784 1.75 1.75 1.75h8.5A1.75 1.75 0 0 0 14 13.25v-5.5A1.75 1.75 0 0 0 12.25 6H12V4a4 4 0 1 0-8 0Zm6.5 2V4a2.5 2.5 0 0 0-5 0v2h5Z", label: "Secure Keychain storage" },
    { icon: "M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z", label: "Auto-update git config" },
    { icon: "M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16Zm3.78-9.72a.751.751 0 0 0-.018-1.042.751.751 0 0 0-1.042-.018L6.75 9.19 5.28 7.72a.751.751 0 0 0-1.042.018.751.751 0 0 0-.018 1.042l2 2a.75.75 0 0 0 1.06 0Z", label: "Switch notifications" },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 py-12 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl gradient-green flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 16 16">
          <path d="M10.561 8.073a6.005 6.005 0 0 1 3.432 5.142.75.75 0 1 1-1.498.07 4.5 4.5 0 0 0-8.99 0 .75.75 0 0 1-1.498-.07 6.004 6.004 0 0 1 3.431-5.142 3.999 3.999 0 1 1 5.123 0ZM10.5 5a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z" />
        </svg>
      </div>

      <h2 className="text-lg font-semibold text-github-gray-light mb-1">
        No accounts yet
      </h2>
      <p className="text-sm text-github-gray mb-6 text-center">
        Add your GitHub accounts to start switching between them with a single click.
      </p>

      <div className="w-full space-y-2 mb-6">
        {features.map((feature) => (
          <div key={feature.label} className="flex items-center gap-3 px-4 py-2 rounded-lg bg-github-dark-alt/40">
            <svg className="w-4 h-4 text-github-green flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
              <path d={feature.icon} />
            </svg>
            <span className="text-xs text-github-gray-light">{feature.label}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onAddAccount}
        className="px-6 py-2.5 rounded-lg gradient-green text-white text-sm font-medium spring-transition hover:brightness-110 active:scale-95"
      >
        Add First Account
      </button>
    </div>
  );
}
