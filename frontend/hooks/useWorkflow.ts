"use client";
import { useState, useCallback, useRef } from "react";
import { aiApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import type { GenerationInstruction } from "@/lib/types";

export interface WorkflowResult {
  notes?: { note_id: string; title: string; path: string; created_at: string };
  flashcards?: { flashcard_id: string; title: string; created_at: string };
  quizes?: { quiz_id: string; title: string; created_at: string };
}

/** How often (ms) to poll the job status endpoint */
const POLL_INTERVAL = 2000;

export function useWorkflow() {
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { addToast } = useToast();

  /** Stop the polling interval */
  const _clearInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startWorkflow = useCallback(
    (
      resourceId: string,
      instructions: GenerationInstruction[],
      onResult?: (result: WorkflowResult) => void
    ) => {
      setLoading(true);
      setStatusMessage("Starting AI workflow...");
      setError(null);
      setJobId(null);

      aiApi
        .generate(resourceId, instructions)
        .then((res) => {
          const fetchedJobId: string = res.data.job_id;
          setJobId(fetchedJobId);
          setStatusMessage("Queued");

          // Poll the job status endpoint every POLL_INTERVAL ms
          intervalRef.current = setInterval(async () => {
            try {
              const { data } = await aiApi.jobStatus(fetchedJobId);

              // Always reflect the latest workflow status message
              if (data.message) {
                setStatusMessage(data.message);
              }

              if (data.status === "completed") {
                _clearInterval();
                setLoading(false);
                setStatusMessage(null);
                addToast("AI Generation Complete! 🎉", "success");
                if (onResult && data.result) onResult(data.result);

              } else if (data.status === "failed") {
                _clearInterval();
                const errorMsg = data.message || "An error occurred during AI generation.";
                setError(errorMsg);
                addToast(`AI Error: ${errorMsg}`, "error");
                setLoading(false);
                setStatusMessage(null);
              }
              // "pending" and "running" — just keep polling
            } catch (pollErr) {
              console.error("Job status poll failed:", pollErr);
              // Network blip — keep retrying; don't fail the job yet
            }
          }, POLL_INTERVAL);
        })
        .catch((err) => {
          const isInsufficientCredits = err?.response?.data?.message === "Insufficient credits";
          const msg = err?.response?.data?.detail || "Failed to start AI generation workflow.";
          
          if (isInsufficientCredits) {
            addToast("Insufficient Credits ⚡ — Please top up your wallet in Settings to generate AI content.", "error");
          } else {
            addToast(msg, "error");
          }
          
          setError(msg);
          setLoading(false);
          setStatusMessage(null);
        });
    },
    [addToast, _clearInterval]
  );

  const cancelWorkflow = useCallback(() => {
    _clearInterval();
    setLoading(false);
    setStatusMessage(null);
  }, [_clearInterval]);

  return {
    loading,
    jobId,
    statusMessage,
    error,
    startWorkflow,
    cancelWorkflow,
  };
}
