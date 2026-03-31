import { Check } from "lucide-react";

interface Step {
  label: string;
  status: "done" | "active" | "pending";
}

export function StepIndicator({ steps }: { steps: Step[] }) {
  return (
    <div className="mb-8 flex items-center gap-2">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                step.status === "done"
                  ? "bg-primary text-white"
                  : step.status === "active"
                  ? "bg-primary text-white"
                  : "bg-muted text-text-secondary"
              }`}
            >
              {step.status === "done" ? <Check size={10} strokeWidth={3} /> : i + 1}
            </div>
            <span
              className={`text-xs font-semibold ${
                step.status === "active"
                  ? "text-text-primary"
                  : step.status === "done"
                  ? "text-primary"
                  : "text-text-secondary"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="h-px w-8 bg-muted" />
          )}
        </div>
      ))}
    </div>
  );
}
