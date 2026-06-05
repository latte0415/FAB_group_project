"use client";

type PipelineProgressBarProps = {
  percent: number;
  visible: boolean;
};

export function PipelineProgressBar({ percent, visible }: PipelineProgressBarProps) {
  return (
    <div
      aria-hidden={!visible}
      aria-label="Pipeline execution progress"
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={visible ? percent : 0}
      className={`pipeline-progress-bar ${visible ? "" : "is-hidden"}`}
      role={visible ? "progressbar" : undefined}
    >
      <div className="pipeline-progress-track">
        <div className="pipeline-progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <span className="pipeline-progress-percent">{percent}%</span>
    </div>
  );
}
