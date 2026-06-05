"use client";

import type { PipelineFlowStep } from "@/lib/config/pipeline-flow-config";

type PipelinePanelProps = {
  steps: PipelineFlowStep[];
  activeStep: number;
  completedStepIndexes: Set<number>;
  maxNavigableStep: number;
  onStepSelect: (index: number) => void;
};

export function PipelinePanel({
  steps,
  activeStep,
  completedStepIndexes,
  maxNavigableStep,
  onStepSelect,
}: PipelinePanelProps) {
  return (
    <nav aria-label="Pipeline flow" className="pipeline-panel">
      {steps.map((step, index) => {
        const isCompleted = completedStepIndexes.has(index);
        const isActive = activeStep === index;
        const isReachable = index <= maxNavigableStep;

        return (
          <button
            aria-current={isActive ? "step" : undefined}
            aria-label={`Step ${index + 1}: ${step.label}${
              isCompleted ? " (complete)" : !isReachable ? " (locked)" : ""
            }`}
            className={`pipeline-step ${isCompleted ? "completed" : ""} ${
              isActive ? "active" : ""
            } ${!isReachable ? "locked" : ""}`}
            disabled={!isReachable}
            key={step.id}
            onClick={() => onStepSelect(index)}
            title={step.label}
            type="button"
          >
            <span className="pipeline-step-index">
              {isCompleted ? "✓" : String(index + 1).padStart(2, "0")}
            </span>
            <span className="pipeline-step-label">{step.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
