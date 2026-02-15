
export interface Chapter {
  id: string;
  title: string;
  subsections: string[];
  content?: string;
  status: 'pending' | 'writing' | 'completed';
  wordCount?: number;
}

export interface BookHistoryEvent {
  timestamp: string;
  event: string;
  version: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  targetLength: number; // In pages
  wordCountGoal: number;
  outline: Chapter[];
  covers: string[];
  selectedCoverIndex?: number;
  createdAt: string;
  history: BookHistoryEvent[];
}

export enum AppState {
  HOME = 'HOME',
  OUTLINING = 'OUTLINING',
  OUTLINE_EDITOR = 'OUTLINE_EDITOR',
  WRITING = 'WRITING',
  VIEWER = 'VIEWER',
  DEVELOPER = 'DEVELOPER',
  HISTORY = 'HISTORY',
  ABOUT = 'ABOUT'
}

export interface GenerationProgress {
  currentChapter: number;
  totalChapters: number;
  message: string;
}
