import { AgentState, ParentReport, RecalledWord, StoryFrame, WordCategory } from "@/lib/types";

export const initialAgentState: AgentState = {
  stage: "start",
  recalledWords: [],
  storyFrame: {},
};

export function getOpeningMessage(): string {
  return "오늘 읽은 책에서 기억나는 단어 3개만 말해볼까? 사람, 장소, 물건 뭐든 좋아 🙂";
}

export function categorizeWord(word: string): WordCategory {
  const personKeywords = ["엄마", "아빠", "할머니", "할아버지", "아이", "친구", "왕", "공주", "선생님", "주인공"];
  const placeKeywords = ["집", "학교", "숲", "바다", "도서관", "공원", "나라", "마을", "궁전", "산", "강"];
  const emotionKeywords = ["기쁨", "슬픔", "화남", "무서움", "용기", "행복", "사랑", "걱정", "놀람"];
  const eventKeywords = ["여행", "싸움", "약속", "모험", "발견", "변신", "축제", "만남", "출발", "도전"];

  if (personKeywords.some((k) => word.includes(k))) return "사람";
  if (placeKeywords.some((k) => word.includes(k))) return "장소";
  if (emotionKeywords.some((k) => word.includes(k))) return "감정";
  if (eventKeywords.some((k) => word.includes(k))) return "사건";
  return "물건";
}

export function normalizeWords(input: string): RecalledWord[] {
  return input
    .split(/[\n,\/]/)
    .map((word) => word.trim())
    .filter(Boolean)
    .map((word) => ({ word, category: categorizeWord(word) }));
}

export function dedupeWords(words: RecalledWord[]): RecalledWord[] {
  const seen = new Set<string>();
  return words.filter((item) => {
    const key = item.word.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function applyUserInputToState(prevState: AgentState, userText: string): AgentState {
  const nextState: AgentState = {
    ...prevState,
    storyFrame: { ...prevState.storyFrame },
    recalledWords: [...prevState.recalledWords],
  };

  if (["start", "word_recall", "word_expand", "hint_recall", "word_organize"].includes(nextState.stage)) {
    nextState.recalledWords = dedupeWords([...nextState.recalledWords, ...normalizeWords(userText)]);
    nextState.stage = nextState.recalledWords.length >= 20 ? "story_build" : "word_expand";
    return nextState;
  }

  if (nextState.stage === "story_build" || nextState.stage === "story_expand") {
    if (!nextState.storyFrame.protagonist) nextState.storyFrame.protagonist = userText;
    else if (!nextState.storyFrame.place) nextState.storyFrame.place = userText;
    else if (!nextState.storyFrame.problem) nextState.storyFrame.problem = userText;
    else if (!nextState.storyFrame.ending) {
      nextState.storyFrame.ending = userText;
      nextState.stage = "done";
      return nextState;
    }

    nextState.stage = "story_build";
    return nextState;
  }

  return nextState;
}

export function buildParentReport(state: AgentState): ParentReport {
  const grouped: ParentReport["categories"] = {
    사람: [],
    장소: [],
    물건: [],
    감정: [],
    사건: [],
  };

  state.recalledWords.forEach((item) => {
    grouped[item.category].push(item.word);
  });

  const storySummary = [
    state.storyFrame.protagonist ? `주인공은 ${state.storyFrame.protagonist}` : "주인공 정보 없음",
    state.storyFrame.place ? `${state.storyFrame.place}에서 이야기를 시작했고` : "장소 정보 없음",
    state.storyFrame.problem ? `${state.storyFrame.problem} 같은 일이 생겼어요.` : "사건 정보 없음",
    state.storyFrame.ending ? `마지막에는 ${state.storyFrame.ending}` : "결말 정보 없음",
  ].join(" ");

  return {
    bookTitle: state.selectedBook?.title,
    totalWords: state.recalledWords.length,
    categories: grouped,
    storySummary,
    encouragement:
      "오늘은 책을 떠올리며 단어를 모으고, 그 단어들로 새로운 이야기도 만들었어요. 기억력과 상상력을 함께 키운 멋진 시간이었습니다.",
  };
}

export function getNextLocalFallback(nextState: AgentState): string {
  if (nextState.stage === "word_expand") {
    if (nextState.recalledWords.length < 5) return "좋아! 잘했어 👍 이번에는 사람을 하나 더 떠올려볼까?";
    if (nextState.recalledWords.length < 10) return "멋지다 🙂 이번에는 장소를 생각해볼까? 어디가 나왔지?";
    return "좋아! 이번에는 물건이나 마음을 떠올려볼까?";
  }

  if (nextState.stage === "story_build") {
    if (!nextState.storyFrame.protagonist) return "와! 잘 기억했네 👍 이제 이 단어들로 새로운 이야기 만들어볼까? 주인공은 누구야?";
    if (!nextState.storyFrame.place) return "좋아! 어디에서 시작해?";
    if (!nextState.storyFrame.problem) return "무슨 일이 생겼어?";
    return "어떻게 끝났어?";
  }

  if (nextState.stage === "done") {
    return "와! 잘했어 👍 그 다음에는 어떻게 됐을까? 다른 결말도 만들어볼까?";
  }

  return getOpeningMessage();
}

export function summarizeStateForPrompt(state: AgentState): string {
  return JSON.stringify(
    {
      stage: state.stage,
      recalledWords: state.recalledWords.map((item) => item.word),
      recalledWordCount: state.recalledWords.length,
      storyFrame: state.storyFrame,
      selectedBook: state.selectedBook,
    },
    null,
    2,
  );
}
