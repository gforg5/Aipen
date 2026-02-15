
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
  targetLength: number;
  outline: Chapter[];
  covers: string[];
  createdAt: string;
  history: BookHistoryEvent[];
}

export enum AppState {
  HOME = 'HOME',
  OUTLINING = 'OUTLINING',
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
