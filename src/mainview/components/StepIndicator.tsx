interface StepIndicatorProps {
  steps: number;
  currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: steps }, (_, i) => (
        <div key={i} className="flex items-center">
          <div
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i <= currentStep
                ? "bg-github-green scale-100"
                : "bg-github-dark-border scale-75"
            }`}
          />
          {i < steps - 1 && (
            <div
              className={`w-6 h-0.5 transition-all duration-300 ${
                i < currentStep ? "bg-github-green" : "bg-github-dark-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
