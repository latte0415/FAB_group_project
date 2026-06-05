export function reportBatchProgress(input: {
  onProgress?: (percent: number) => void;
  startPercent: number;
  endPercent: number;
  completedBatches: number;
  totalBatches: number;
}) {
  if (!input.onProgress || input.totalBatches <= 0) {
    return;
  }

  const span = input.endPercent - input.startPercent;
  const ratio = input.completedBatches / input.totalBatches;
  const percent = Math.round(input.startPercent + span * ratio);

  input.onProgress(Math.min(100, Math.max(0, percent)));
}
