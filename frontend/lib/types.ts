// ============================================================
// Auth
// ============================================================
export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  wallet?: number;
}

// ============================================================
// Spaces
// ============================================================
export interface Space {
  id: string;
  name: string;
  description: string;
  // Present only on retrieve (SpaceRetriveSerializer)
  modules?: { id: string; name: string }[];
}

// Alias for retrieve response which always includes modules
export type SpaceDetail = Required<Space>;

// ============================================================
// Modules
// ============================================================
export interface Module {
  id: string;
  name: string;
  space?: Space;
  space_id?: string;
}

export interface ModuleDetail {
  id: string;
  name: string;
  resources: Resource[];
}

// ============================================================
// Resources
// ============================================================
export type ResourceType = "youtube" | "file";

export interface YoutubeVideo {
  title: string;
  video_id: string;
  channel_name: string;
  channel_id: string;
  duration: string;
  description: string;
  published_at: string;
  thumbnail_url: string;
}

export interface FileResource {
  file_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  created_at: string;
}

// ─── List items (id + title only) ──────────────────────────
export interface QuizListItem {
  quiz_id: string;
  title: string;
  type: "easy" | "medium" | "hard";
}

export interface NoteListItem {
  note_id: string;
  title: string;
}

export interface FlashCardListItem {
  flashcard_id: string;
  title: string;
}

// ─── Full detail types (returned by individual retrieve) ───
export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
}

export interface QuizDetail {
  quiz_id: string;
  title: string;
  type: "easy" | "medium" | "hard";
  content: QuizQuestion[];
  created_at: string;
  updated_at: string;
}

export interface NoteDetail {
  note_id: string;
  title: string;
  path: string;
  created_at: string;
  updated_at: string;
  download_url?: string;
}

export interface FlashCardItem {
  question: string;
  answer: string;
}

export interface FlashCardDetail {
  flashcard_id: string;
  title: string;
  content: FlashCardItem[];
  created_at: string;
  updated_at: string;
}

// ─── Resource (uses list items) ─────────────────────────────
export interface Resource {
  id: string;
  type: ResourceType;
  youtube?: YoutubeVideo;
  file?: FileResource;
  quizes?: QuizListItem[];
  notes?: NoteListItem[];
  flashcards?: FlashCardListItem[];
}

// ─── Generation instruction ─────────────────────────────────────
export interface GenerationInstruction {
  type: "notes" | "flashcard" | "quize";
  title: string;
  text: string;
}

// ─── Module Quiz types ───────────────────────────────────────────
export interface ModuleQuizListItem {
  quiz_id: string;
  title: string;
  type: "easy" | "medium" | "hard";
  module: string;
  created_at: string;
  updated_at: string;
}

export interface ModuleQuizDetail {
  quiz_id: string;
  title: string;
  type: "easy" | "medium" | "hard";
  module: string;
  content: QuizQuestion[];
  created_at: string;
  updated_at: string;
}

export type QuizAttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "EXPIRED";

export interface QuizAttempt {
  started_at: string;
  expires_at: string;
  submitted_at?: string | null;
  score: number;
  total_questions: number;
  user_answers: Record<string, string>;
  status: QuizAttemptStatus;
  is_expired: boolean;
}

export interface SpaceModuleQuizDetail {
  id: string;
  name: string;
  description?: string;
  modules: {
    id: string;
    name: string;
    quizzes: {
      quiz_id: string;
      title: string;
      attempt?: QuizAttempt | null;
    }[];
  }[];
}

export interface ModuleFlashcardItem {
  question: string;
  answer: string;
}

export interface ModuleFlashcardDetail {
  flashcard_id: string;
  title: string;
  module: string;
  content: ModuleFlashcardItem[];
  created_at: string;
  updated_at: string;
}

export interface SpaceModuleFlashcardDetail {
  id: string;
  name: string;
  description?: string;
  modules: {
    id: string;
    name: string;
    flashcards: {
      flashcard_id: string;
      title: string;
      created_at?: string;
    }[];
  }[];
}
