import axios from "axios";
import type { GenerationInstruction } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT access token from localStorage to every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const access = localStorage.getItem("access_token");
    if (access) config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem("refresh_token");
        if (!refresh) throw new Error("No refresh token");
        const { data } = await axios.post(`${API_URL}/api/auth/token/refresh/`, { refresh });
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        if (typeof window !== "undefined") window.location.href = "/auth";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Auth endpoints ────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/api/auth/token/", { email, password }),
  sendOtp: (email: string) =>
    api.post("/api/auth/send-otp/", { email }),
  register: (name: string, email: string, password: string, otp: string) =>
    api.post("/api/auth/register/", { name, email, password, otp }),
  googleLogin: (token?: string, access_token?: string, code?: string) =>
    api.post("/api/auth/google/", { token, access_token, code }),
  profile: () => api.get("/api/profile/"),
};

// ── Spaces endpoints ──────────────────────────────────────────
export const spacesApi = {
  list: () => api.get("/api/spaces/"),
  create: (name: string, description: string) =>
    api.post("/api/spaces/", { name, description }),
  retrieve: (id: string) => api.get(`/api/spaces/${id}/`),
  update: (id: string, data: { name?: string; description?: string }) =>
    api.patch(`/api/spaces/${id}/`, data),
  destroy: (id: string) => api.delete(`/api/spaces/${id}/`),
};

// ── Modules endpoints ─────────────────────────────────────────
export const modulesApi = {
  create: (name: string, space_id: string) =>
    api.post("/api/modules/", { name, space_id }),
  retrieve: (id: string) => api.get(`/api/modules/${id}/`),
  update: (id: string, name: string) => api.patch(`/api/modules/${id}/`, { name }),
  destroy: (id: string) => api.delete(`/api/modules/${id}/`),
};

// ── Resources endpoints ───────────────────────────────────────
export const resourcesApi = {
  addVideo: (url: string, module: string) =>
    api.post("/api/add/video/", { url, module }),
  addPlaylist: (url: string, module: string) =>
    api.post("/api/add/playlist/", { url, module }),
  retrieve: (id: string) => api.get(`/api/resources/${id}/`),
};

// ── AI endpoints ──────────────────────────────────────────────
export const aiApi = {
  generate: (resource_id: string, instructions: GenerationInstruction[], job_id?: string) => {
    const id = job_id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
    return api.post("/api/ai/generate/", { resource_id, instructions, job_id: id });
  },

  /** Poll this endpoint until status is "completed" or "failed" */
  jobStatus: (job_id: string) =>
    api.get(`/api/ai/jobs/${job_id}/`),

  // ── Quiz ──
  retrieveQuiz: (quiz_id: string) => api.get(`/api/quize/${quiz_id}/`),
  renameQuiz: (quiz_id: string, title: string) => api.patch(`/api/quize/${quiz_id}/`, { title }),
  deleteQuiz: (quiz_id: string) => api.delete(`/api/quize/${quiz_id}/`),

  // ── Notes ──
  retrieveNote: (note_id: string) => api.get(`/api/notes/${note_id}/`),
  renameNote: (note_id: string, title: string) => api.patch(`/api/notes/${note_id}/`, { title }),
  deleteNote: (note_id: string) => api.delete(`/api/notes/${note_id}/`),

  // ── Flashcards ──
  retrieveFlashcard: (flashcard_id: string) => api.get(`/api/flashcards/${flashcard_id}/`),
  renameFlashcard: (flashcard_id: string, title: string) => api.patch(`/api/flashcards/${flashcard_id}/`, { title }),
  deleteFlashcard: (flashcard_id: string) => api.delete(`/api/flashcards/${flashcard_id}/`),

  // ── Video AI Doubt Chat & Resource Index Status ──
  checkResourceIndexed: (resource_id: string) => api.get("/api/ai/resource-indexed/", { params: { resource_id } }),
  getVideoChatHistory: (resource_id: string) => api.get("/api/ai/chat-video/", { params: { resource_id } }),
  deleteVideoChatSession: (resource_id: string) => api.delete("/api/ai/chat-video/", { params: { resource_id } }),
};

// ── Resource endpoints ────────────────────────────────────────
export const resourceApi = {
  destroy: (resource_id: string) => api.delete(`/api/resources/${resource_id}/`),
};

// ── Module Quiz endpoints ─────────────────────────────────────
export const moduleQuizApi = {
  /** List all quizzes for a module */
  listQuizzes: (module_id: string) =>
    api.get("/api/ai/module-quiz/", { params: { module_id } }),

  /** Generate a new quiz for a module */
  generateQuiz: (payload: {
    module: string;
    resources: string[];
    instruction: {
      type: "quize" | "flashcard";
      title: string;
      text: string;
      number_of_items: number;
    };
    job_id?: string;
  }) => api.post("/api/ai/module-quiz/", payload),

  /** Poll module job status */
  jobStatus: (job_id: string) =>
    api.get(`/api/ai/jobs/module/${job_id}/`),

  /** Get indexed (processable) resources for a module */
  indexedResources: (module_id: string) =>
    api.get("/api/ai/module-resources/", { params: { module_id } }),

  /** Retrieve space with all modules and their quizzes */
  getSpaceQuizzes: (space_id: string) =>
    api.get(`/api/space/quizes/${space_id}/`),

  /** Retrieve a single module quiz by quiz_id */
  retrieveQuiz: (quiz_id: string) =>
    api.get(`/api/module-quize/${quiz_id}/`),
};

// ── Module Flashcard endpoints ────────────────────────────────
export const moduleFlashcardApi = {
  /** Retrieve space with all modules and their flashcards */
  getSpaceFlashcards: (space_id: string) =>
    api.get(`/api/space/flashcards/${space_id}/`),

  /** Retrieve a single module flashcard by flashcard_id */
  retrieveFlashcard: (flashcard_id: string) =>
    api.get(`/api/module-flashcard/${flashcard_id}/`),

  /** Generate a new flashcard deck for a module */
  generateFlashcard: (payload: {
    module: string;
    resources: string[];
    instruction: {
      type: "flashcard";
      title: string;
      text: string;
      number_of_items: number;
    };
    job_id?: string;
  }) => api.post("/api/ai/module-quiz/", payload),

  /** Get indexed resources for a module */
  indexedResources: (module_id: string) =>
    api.get("/api/ai/module-resources/", { params: { module_id } }),

  /** Poll module job status */
  jobStatus: (job_id: string) =>
    api.get(`/api/ai/jobs/module/${job_id}/`),
};

// ── Quiz Attempt Endpoints ────────────────────────────────────
export const moduleQuizAttemptApi = {
  start: (quiz_id: string, duration_minutes: number = 15) =>
    api.post("/api/ai/module-quiz-attempt/start/", { quiz_id, duration_minutes }),
  save: (quiz_id: string, user_answers: Record<string, string>, submit: boolean = false) =>
    api.post("/api/ai/module-quiz-attempt/save/", { quiz_id, user_answers, submit }),
  get: (quiz_id: string) =>
    api.get(`/api/ai/module-quiz-attempt/${quiz_id}/`),
};

export const resourceQuizAttemptApi = {
  start: (quiz_id: string, duration_minutes: number = 15) =>
    api.post("/api/ai/resource-quiz-attempt/start/", { quiz_id, duration_minutes }),
  save: (quiz_id: string, user_answers: Record<string, string>, submit: boolean = false) =>
    api.post("/api/ai/resource-quiz-attempt/save/", { quiz_id, user_answers, submit }),
  get: (quiz_id: string) =>
    api.get(`/api/ai/resource-quiz-attempt/${quiz_id}/`),
};

// ── Dashboard endpoints ───────────────────────────────────────
export const dashboardApi = {
  getReportTags: () => api.get("/api/dashboard/report-tags/"),
  getModuleProgress: () => api.get("/api/dashboard/module-progress/"),
  getLearningProgress: (days: number = 90) => api.get("/api/dashboard/learning-progress/", { params: { days } }),
  getHeatMap: (month: number, year: number) => api.get("/api/dashboard/heatmap/", { params: { month, year } }),
  getQuizPerformance: () => api.get("/api/dashboard/quiz-performance/"),
};

// ── Payments endpoints ────────────────────────────────────────
export const paymentsApi = {
  createOrder: (amount: number) =>
    api.post("/api/payments/create-order/", { amount }),
  verifyPayment: (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => api.post("/api/payments/verify/", payload),
  getHistory: () => api.get("/api/payments/history/"),
};



