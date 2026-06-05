export type EnvisioningTaskConfig = {
  maxHiddenRelations: number;
  relationTypePriority: string[];
};

export const defaultEnvisioningTaskConfig: EnvisioningTaskConfig = {
  maxHiddenRelations: 1,
  relationTypePriority: [
    "supports",
    "depends_on",
    "uses",
    "organizes",
    "solves",
    "addresses",
  ],
};
