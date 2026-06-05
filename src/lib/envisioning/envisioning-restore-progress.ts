import type { TaskAttemptState } from "@/components/envisioning/envisioning-panel";
import type { HiddenRelationTask } from "@/schemas/benchmark-ontology";

export function isRestoreTaskInteractionComplete(
  task: HiddenRelationTask,
  attemptState: TaskAttemptState | undefined,
) {
  if (!attemptState?.feedback) {
    return false;
  }

  if (attemptState.feedback.result === "correct" || attemptState.isRestored) {
    return true;
  }

  return attemptState.debugGuidance !== null;
}

export function isEnvisioningRestoreComplete(
  restoreTasks: HiddenRelationTask[],
  attemptsByTaskId: Record<string, TaskAttemptState>,
) {
  if (restoreTasks.length === 0) {
    return false;
  }

  return restoreTasks.every((task) =>
    isRestoreTaskInteractionComplete(task, attemptsByTaskId[task.id]),
  );
}

export function countCompletedRestoreTasks(
  restoreTasks: HiddenRelationTask[],
  attemptsByTaskId: Record<string, TaskAttemptState>,
) {
  return restoreTasks.filter((task) =>
    isRestoreTaskInteractionComplete(task, attemptsByTaskId[task.id]),
  ).length;
}
