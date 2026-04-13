export type WordCategory = "사람" | "장소" | "물건" | "감정" | "사건";

export type Book = {
  title: string;
  author?: string;
  publisher?: string;
  isbn?: string;
  description?: string;
};

export type RecalledWord = {
  word: string;
  category: WordCategory;
};

export type StoryFrame = {
  protagonist?: string;
  place?: string;
  problem?: string;
  ending?: string;
};

export type AgentStage =
  | "start"
  | "word_recall"
  | "word_expand"
  | "hint_recall"
  | "word_organize"
  | "story_build"
  | "story_expand"
  | "done";

export type AgentState = {
  stage: AgentStage;
  recalledWords: RecalledWord[];
  storyFrame: StoryFrame;
  selectedBook?: Book;
};

export type ParentReport = {
  bookTitle?: string;
  totalWords: number;
  categories: Record<WordCategory, string[]>;
  storySummary: string;
  encouragement: string;
};

export type ChatMessage = {
  role: "assistant" | "user";
  text: string;
};
