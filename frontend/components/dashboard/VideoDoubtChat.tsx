"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Sparkles,
  User,
  Bot,
  Trash2,
  RefreshCw,
  HelpCircle,
  MessageSquare,
  AlertCircle,
  Zap,
} from "lucide-react";
import type { Resource } from "@/lib/types";
import { aiApi } from "@/lib/api";

import katex from "katex";
import "katex/dist/katex.min.css";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  resource: Resource;
}

const SUGGESTED_DOUBTS = [
  "Summarize the main concepts in this video",
  "Explain the key formulas or definitions mentioned",
  "What are the most common exam questions from this topic?",
  "Give me a quick 3-question quiz to test my understanding",
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function LatexRenderer({ math, displayMode }: { math: string; displayMode?: boolean }) {
  try {
    const html = katex.renderToString(math.trim(), {
      displayMode: !!displayMode,
      throwOnError: false,
    });
    return (
      <span
        className={displayMode ? "block my-2 text-center overflow-x-auto py-1" : "inline-block px-1"}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch {
    return <code>{math}</code>;
  }
}

function parseInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\\\([\s\S]*?\\\)|(?<!\\)\$[^$\n]+\$|\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("\\(") && token.endsWith("\\)")) {
      const math = token.slice(2, -2);
      parts.push(<LatexRenderer key={match.index} math={math} displayMode={false} />);
    } else if (token.startsWith("$") && token.endsWith("$") && token.length > 2) {
      const math = token.slice(1, -1);
      parts.push(<LatexRenderer key={match.index} math={math} displayMode={false} />);
    } else if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={match.index} className="font-bold text-inherit">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded bg-amber-100/70 border border-amber-200/50 font-mono text-[11px] text-amber-900"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(
        <em key={match.index} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

export function FormattedMarkdown({ content }: { content: string }) {
  if (!content) return null;

  const blockRegex = /(```[\s\S]*?```|\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$)/g;
  const blocks: { type: "code" | "math" | "markdown"; text: string }[] = [];
  let lastIndex = 0;
  let match;

  while ((match = blockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ type: "markdown", text: content.substring(lastIndex, match.index) });
    }
    const token = match[0];
    if (token.startsWith("```")) {
      blocks.push({ type: "code", text: token });
    } else {
      blocks.push({ type: "math", text: token });
    }
    lastIndex = blockRegex.lastIndex;
  }
  if (lastIndex < content.length) {
    blocks.push({ type: "markdown", text: content.substring(lastIndex) });
  }

  return (
    <div className="flex flex-col gap-2 font-sans text-xs md:text-sm leading-relaxed">
      {blocks.map((block, bIdx) => {
        if (block.type === "code") {
          const raw = block.text.slice(3, -3);
          const firstLineEnd = raw.indexOf("\n");
          let codeContent = raw;
          if (firstLineEnd !== -1) {
            codeContent = raw.substring(firstLineEnd + 1);
          }
          return (
            <pre
              key={bIdx}
              className="p-3 my-2 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto font-mono text-xs border border-slate-800"
            >
              <code>{codeContent.trim()}</code>
            </pre>
          );
        }

        if (block.type === "math") {
          let math = block.text;
          if (math.startsWith("\\[") && math.endsWith("\\]")) {
            math = math.slice(2, -2);
          } else if (math.startsWith("$$") && math.endsWith("$$")) {
            math = math.slice(2, -2);
          }
          return <LatexRenderer key={bIdx} math={math} displayMode={true} />;
        }

        const lines = block.text.split("\n");
        return (
          <div key={bIdx} className="flex flex-col gap-1.5">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return null;

              if (trimmed.startsWith("#### ")) {
                return (
                  <h5 key={lIdx} className="font-bold text-xs mt-2 mb-0.5">
                    {parseInlineMarkdown(trimmed.slice(5))}
                  </h5>
                );
              }
              if (trimmed.startsWith("### ")) {
                return (
                  <h4 key={lIdx} className="font-bold text-sm mt-2.5 mb-1 heading-font">
                    {parseInlineMarkdown(trimmed.slice(4))}
                  </h4>
                );
              }
              if (trimmed.startsWith("## ")) {
                return (
                  <h3 key={lIdx} className="font-bold text-base mt-3 mb-1 heading-font">
                    {parseInlineMarkdown(trimmed.slice(3))}
                  </h3>
                );
              }
              if (trimmed.startsWith("# ")) {
                return (
                  <h2 key={lIdx} className="font-bold text-lg mt-3.5 mb-1 heading-font">
                    {parseInlineMarkdown(trimmed.slice(2))}
                  </h2>
                );
              }

              if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
                return <hr key={lIdx} className="my-2 border-t border-[#E6E0D6]" />;
              }

              if (trimmed.startsWith("> ")) {
                return (
                  <blockquote
                    key={lIdx}
                    className="border-l-3 border-[#0D9488] pl-3 py-0.5 my-1 italic text-[#78716C] bg-teal-50/40 rounded-r-lg"
                  >
                    {parseInlineMarkdown(trimmed.slice(2))}
                  </blockquote>
                );
              }

              if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-2 my-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] shrink-0 mt-1.5" />
                    <span>{parseInlineMarkdown(trimmed.slice(2))}</span>
                  </div>
                );
              }

              const matchNum = trimmed.match(/^(\d+)\.\s+(.*)/);
              if (matchNum) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-2 my-0.5">
                    <span className="font-bold text-[#0D9488] shrink-0 text-xs mt-0.5">
                      {matchNum[1]}.
                    </span>
                    <span>{parseInlineMarkdown(matchNum[2])}</span>
                  </div>
                );
              }

              return <p key={lIdx}>{parseInlineMarkdown(line)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}

export function VideoDoubtChat({ resource }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [isIndexed, setIsIndexed] = useState<boolean | null>(null);
  const [isIndexing, setIsIndexing] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of discussion
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Fetch previous chat history on resource change
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setIsIndexed(null);

    async function loadHistory() {
      try {
        const res = await aiApi.getVideoChatHistory(resource.id);
        if (isMounted) {
          if (res.data?.is_indexed !== undefined) {
            setIsIndexed(res.data.is_indexed);
          } else {
            setIsIndexed(true);
          }
          const fetchedMessages = res.data?.messages || [];
          setMessages(
            fetchedMessages.map((m: any) => ({
              role: m.role === "human" || m.role === "user" ? "user" : "assistant",
              content: m.content,
            }))
          );
          if (res.data?.thread_id) {
            setThreadId(res.data.thread_id);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Failed to load chat history", err);
          setError("Could not load previous chat history. You can start asking new doubts.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [resource.id]);

  const [indexJobId, setIndexJobId] = useState<string | null>(null);
  const [indexingMessage, setIndexingMessage] = useState<string | null>(null);

  const handleIndexVideo = async () => {
    setIsIndexing(true);
    setError(null);
    try {
      const jobId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
      setIndexJobId(jobId);
      setIndexingMessage("Queued");
      await aiApi.generate(resource.id, [], jobId);

      let completed = false;
      for (let i = 0; i < 40; i++) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        try {
          const jobRes = await aiApi.jobStatus(jobId);
          if (jobRes.data?.message) {
            setIndexingMessage(jobRes.data.message);
          }
          if (jobRes.data?.status === "completed") {
            completed = true;
            break;
          } else if (jobRes.data?.status === "failed") {
            throw new Error(jobRes.data?.message || "Video processing failed.");
          }
        } catch (err: any) {
          if (err.message === "Video processing failed.") throw err;
        }
      }

      if (completed) {
        setIsIndexed(true);
      } else {
        const checkRes = await aiApi.getVideoChatHistory(resource.id);
        if (checkRes.data?.is_indexed) {
          setIsIndexed(true);
        } else {
          setError("Video processing is taking longer than expected. Please check back shortly.");
        }
      }
    } catch (err: any) {
      console.error("Failed to process video", err);
      setError(err.message || "Failed to process video. Please try again.");
    } finally {
      setIsIndexing(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isStreaming) return;

    setInput("");
    setError(null);

    const newMessages: Message[] = [...messages, { role: "user", content: query }];
    setMessages(newMessages);
    setIsStreaming(true);

    // Placeholder AI response for streaming
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

      const response = await fetch(`${API_URL}/api/ai/chat-video/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          resource_id: resource.id,
          thread_id: threadId || undefined,
          messages: newMessages,
          video_id: resource.youtube?.video_id || undefined,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.detail || errData?.message || `Server error (${response.status})`);
      }

      if (!response.body) {
        throw new Error("No response stream available.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;

        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
            updated[lastIdx] = { role: "assistant", content: accumulatedText };
          }
          return updated;
        });
      }
    } catch (err: any) {
      console.error("Streaming error:", err);
      setError(err?.message || "Failed to get AI response. Please try again.");
      setMessages((prev) => prev.filter((m) => m.content.length > 0));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to reset this doubt discussion thread?")) return;
    try {
      setLoading(true);
      await aiApi.deleteVideoChatSession(resource.id);
      setMessages([]);
      setThreadId(null);
      setError(null);
    } catch (err) {
      console.error("Failed to clear chat history", err);
      setError("Failed to reset discussion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-[#FFFDF9] rounded-2xl border border-[#E6E0D6] shadow-xs overflow-hidden min-h-[480px]">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-5 py-4 bg-[#F5EFE6]/60 border-b border-[#E6E0D6]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-[#0D9488] shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1C1917] leading-tight heading-font flex flex-wrap items-center gap-2">
              AI Doubt Discussion
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-100/70 text-[#0F766E]">
                Context Aware
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100/90 text-amber-900 border border-amber-300/60 flex items-center gap-1 shadow-2xs">
                <Zap className="w-3 h-3 text-amber-600 fill-amber-500" />
                2 Credits / Question
              </span>
            </h3>
            <p className="text-xs text-[#78716C]">Ask doubts, seek explanations, or request timestamp breakdowns.</p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            disabled={isStreaming}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#78716C] hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-[#E6E0D6] hover:border-red-200"
            title="Reset discussion"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Message Feed Area */}
      <div className="flex-1 p-5 overflow-y-auto max-h-[460px] flex flex-col gap-4 bg-[#FFFDF9]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#78716C]">
            <RefreshCw className="w-6 h-6 animate-spin text-[#0D9488]" />
            <p className="text-xs font-medium">Loading doubt discussion thread…</p>
          </div>
        ) : isIndexed === false ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-4 shadow-xs">
              <Sparkles className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-[#1C1917] heading-font mb-2">
              Video Content Not Processed Yet
            </h4>
            <p className="text-xs text-[#78716C] mb-3 leading-relaxed">
              Before asking AI doubts, this video needs to be processed and indexed into our AI vector database.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200/80 text-amber-900 rounded-full text-xs font-semibold mb-6 shadow-2xs">
              <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              <span>Processing Cost: 50 Credits</span>
            </div>

            {isIndexing && (
              <div className="mb-4 p-3 bg-teal-50 border border-teal-200/80 rounded-xl flex items-center justify-between text-xs text-[#0D9488] w-full">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                  <span className="font-semibold">{indexingMessage || "Processing video..."}</span>
                </div>
                {indexJobId && (
                  <span className="font-mono text-[10px] bg-teal-100/60 px-2 py-0.5 rounded">
                    Job: {indexJobId.slice(0, 8)}
                  </span>
                )}
              </div>
            )}

            <button
              onClick={handleIndexVideo}
              disabled={isIndexing}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {isIndexing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Video…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Process Video for AI Doubts (50 Credits ⚡)</span>
                </>
              )}
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0D9488] mb-3 shadow-xs">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-[#1C1917] heading-font mb-1">
              Have a doubt about this lesson?
            </h4>
            <p className="text-xs text-[#78716C] max-w-md mb-2 leading-relaxed">
              Our AI reads this video's transcript and topic details to answer your doubts instantly.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200/80 text-amber-900 rounded-full text-xs font-semibold mb-6 shadow-2xs">
              <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              <span>2 Credits per asked question</span>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="w-full max-w-lg flex flex-col gap-2">
              <p className="text-[11px] font-bold text-[#A8A29E] uppercase tracking-wider text-left pl-1">
                Suggested Doubts
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {SUGGESTED_DOUBTS.map((doubt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(doubt)}
                    className="p-3 rounded-xl bg-[#FFFDF9] hover:bg-[#F5EFE6] border border-[#E6E0D6] text-xs text-[#1C1917] font-medium transition-all text-left flex items-start gap-2 group hover:border-[#0D9488]/40 shadow-xs"
                  >
                    <HelpCircle className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <span>{doubt}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-3 max-w-[85%] ${
                msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold shadow-xs ${
                  msg.role === "user"
                    ? "bg-[#1C1917] text-white"
                    : "bg-[#0D9488] text-white"
                }`}
              >
                {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Speech Bubble */}
              <div
                className={`p-4 rounded-2xl text-xs md:text-sm leading-relaxed shadow-xs ${
                  msg.role === "user"
                    ? "bg-[#1C1917] text-white rounded-tr-none"
                    : "bg-[#F5EFE6]/80 border border-[#E6E0D6] text-[#1C1917] rounded-tl-none"
                }`}
              >
                {msg.content === "" && isStreaming && index === messages.length - 1 ? (
                  <div className="flex items-center gap-1.5 py-1 text-[#0D9488]">
                    <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-bounce [animation-delay:0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-bounce [animation-delay:0.3s]" />
                  </div>
                ) : (
                  <FormattedMarkdown content={msg.content} />
                )}
              </div>
            </motion.div>
          ))
        )}

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium"
          >
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer Box */}
      <div className="p-4 bg-[#F5EFE6]/40 border-t border-[#E6E0D6]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming}
            placeholder="Ask any doubt regarding this video lesson (2 credits)…"
            className="flex-1 bg-[#FFFDF9] border border-[#E6E0D6] focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/20 rounded-xl px-4 py-3 text-xs md:text-sm text-[#1C1917] placeholder:text-[#A8A29E] outline-none transition-all"
          />

          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="w-11 h-11 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] disabled:bg-[#CBD5E1] text-white flex items-center justify-center font-bold shadow-md transition-all shrink-0"
          >
            {isStreaming ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Send className="w-4 h-4 ml-0.5 stroke-[2.5]" />
            )}
          </button>
        </form>

        <div className="flex items-center justify-between text-[11px] text-[#78716C] mt-2 px-1">
          <span className="text-[10px] text-[#A8A29E]">Press Enter to send</span>
          <span className="flex items-center gap-1 font-bold text-amber-900 text-[11px] bg-amber-100/80 border border-amber-200/80 px-2 py-0.5 rounded-md shadow-2xs">
            <Zap className="w-3 h-3 text-amber-600 fill-amber-500" />
            2 Credits / Question
          </span>
        </div>
      </div>
    </div>
  );
}
