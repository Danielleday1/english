import type {
  DifficultyType,
  IELTSQuestionType,
  MasteryType,
  MaterialType,
  MoodType,
  SentenceTag,
  TopicType,
} from "../types/study";

export const APP_TITLE = "小泥团 English 技能训练营";
export const DAILY_PLANNED_MINUTES = 120;
export const MONTHLY_GOAL_DAYS = 30;

export const STEP_CONFIG = [
  { id: "material", title: "输入今日材料", minutes: 0 },
  { id: "warmup", title: "热身开口", minutes: 5 },
  { id: "blindListening", title: "盲听关键词", minutes: 10 },
  { id: "intensiveListening", title: "精听理解", minutes: 25 },
  { id: "sentences", title: "今日 3 句", minutes: 15 },
  { id: "shadowing", title: "跟读打卡", minutes: 20 },
  { id: "workplaceSpeaking", title: "职场口语输出", minutes: 15 },
  { id: "ieltsListening", title: "雅思听力训练", minutes: 25 },
  { id: "ieltsSpeaking", title: "雅思口语训练", minutes: 25 },
  { id: "review", title: "今日复盘", minutes: 5 },
] as const;

export const MATERIAL_TYPE_OPTIONS: Array<{ value: MaterialType; label: string }> = [
  { value: "podcast", label: "播客" },
  { value: "youtube", label: "YouTube" },
  { value: "ielts_listening", label: "雅思听力" },
  { value: "other", label: "其他" },
];

export const TOPIC_OPTIONS: Array<{ value: TopicType; label: string }> = [
  { value: "ai", label: "AI" },
  { value: "product", label: "产品" },
  { value: "business_meeting", label: "商务会议" },
  { value: "web3", label: "Web3" },
  { value: "ielts", label: "雅思" },
  { value: "free", label: "自由主题" },
];

export const DIFFICULTY_OPTIONS: Array<{ value: DifficultyType; label: string }> = [
  { value: "easy", label: "简单" },
  { value: "medium", label: "中等" },
  { value: "hard", label: "困难" },
];

export const WARMUP_MOOD_OPTIONS: Array<{ value: Exclude<MoodType, "accomplished">; label: string }> = [
  { value: "relaxed", label: "轻松" },
  { value: "normal", label: "一般" },
  { value: "tired", label: "累" },
  { value: "motivated", label: "很有动力" },
];

export const REVIEW_MOOD_OPTIONS: Array<{ value: MoodType; label: string }> = [
  { value: "relaxed", label: "轻松" },
  { value: "normal", label: "一般" },
  { value: "tired", label: "累" },
  { value: "accomplished", label: "很有成就感" },
];

export const SENTENCE_TAG_OPTIONS: Array<{ value: SentenceTag; label: string }> = [
  { value: "opinion", label: "表达观点" },
  { value: "suggestion", label: "提出建议" },
  { value: "problem", label: "解释问题" },
  { value: "meeting", label: "会议沟通" },
  { value: "product", label: "产品表达" },
  { value: "ai", label: "AI行业表达" },
  { value: "web3", label: "Web3表达" },
  { value: "ielts", label: "雅思表达" },
];

export const MASTERY_OPTIONS: Array<{ value: MasteryType; label: string }> = [
  { value: "weak", label: "生疏" },
  { value: "normal", label: "一般" },
  { value: "strong", label: "熟练" },
];

export const IELTS_LISTENING_ERROR_OPTIONS = [
  "没听到关键词",
  "拼写错误",
  "同义替换没反应过来",
  "定位失败",
  "数字/日期听错",
  "走神",
  "语速太快",
] as const;

export const IELTS_QUESTION_OPTIONS: Array<{ value: IELTSQuestionType; label: string }> = [
  { value: "completion", label: "填空" },
  { value: "choice", label: "选择" },
  { value: "matching", label: "匹配" },
  { value: "map", label: "地图" },
  { value: "multiple_choice", label: "多选" },
  { value: "mixed", label: "混合" },
];

export const WORKPLACE_SCENARIOS = [
  {
    title: "介绍一个产品",
    prompt: "Please introduce your AI Visibility product in one minute.",
  },
  {
    title: "解释一个用户问题",
    prompt: "Please explain a recent user problem and how your team handled it.",
  },
  {
    title: "提出一个产品建议",
    prompt: "Please give one product suggestion that could improve the user experience.",
  },
  {
    title: "总结一次会议",
    prompt: "Please summarize a team meeting and the next actions.",
  },
  {
    title: "表达不同意见",
    prompt: "Please disagree politely with a proposal in a meeting and explain why.",
  },
  {
    title: "Pitch 一个创业想法",
    prompt: "Please pitch one startup idea in one minute and explain the value clearly.",
  },
] as const;
