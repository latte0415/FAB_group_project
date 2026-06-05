export type QuizGenerationConfig = {
  maxQuestions: number;
  choicesPerQuestion: number;
};

export const defaultQuizGenerationConfig: QuizGenerationConfig = {
  maxQuestions: 3,
  choicesPerQuestion: 4,
};
