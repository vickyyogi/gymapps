"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";

type Thread = {
  id: string;
  title: string | null;
  program_id: string | null;
  message_count: number;
  last_message_at: string | null;
  created_at: string;
};

type Citation = { type: string; ref_id: string; label: string };
type Card = { id: string; name: string; muscle: string; equipment: string[] };

type Message = {
  id: string;
  thread_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  status: "streaming" | "complete" | "aborted" | "error";
  citations: Citation[] | null;
  feedback: number | null;
  created_at: string;
  cards?: Card[];
};

export function CoachChat() {
  const t = useTranslations("coach");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [quota, setQuota] = useState<{ remaining_hour: number; remaining_day: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const loadThreads = useCallback(async () => {
    const response = await fetch("/api/v1/ai/coach/threads");
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error?.code ?? "INTERNAL_ERROR");
    setThreads(payload.data ?? []);
    setQuota(payload.meta?.quota ?? null);
    return payload.data?.[0]?.id as string | undefined;
  }, []);

  const loadMessages = useCallback(async (id: string) => {
    const response = await fetch(`/api/v1/ai/coach/threads/${id}/messages?limit=100`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error?.code ?? "INTERNAL_ERROR");
    setMessages(payload.data ?? []);
  }, []);

  useEffect(() => {
    loadThreads()
      .then(async (first) => {
        if (!first) return;
        setThreadId(first);
        await loadMessages(first);
      })
      .catch((code) => setError(tErrors.has(code) ? tErrors(code) : tErrors("NETWORK_ERROR")))
      .finally(() => setLoading(false));
  }, [loadMessages, loadThreads, tErrors]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function newThread() {
    setError(null);
    const response = await fetch("/api/v1/ai/coach/threads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });
    const payload = await response.json();
    if (!response.ok) {
      const code = payload?.error?.code ?? "INTERNAL_ERROR";
      setError(tErrors.has(code) ? tErrors(code) : tErrors("INTERNAL_ERROR"));
      return;
    }
    setThreads((current) => [payload.data, ...current]);
    setThreadId(payload.data.id);
    setMessages([]);
  }

  async function deleteThread(id: string) {
    await fetch(`/api/v1/ai/coach/threads/${id}`, { method: "DELETE" });
    const next = threads.filter((thread) => thread.id !== id);
    setThreads(next);
    if (threadId === id) {
      setThreadId(next[0]?.id ?? null);
      setMessages([]);
      if (next[0]) await loadMessages(next[0].id);
    }
  }

  async function selectThread(id: string) {
    if (streaming) return;
    setThreadId(id);
    setError(null);
    await loadMessages(id);
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || streaming) return;
    let activeThread = threadId;
    if (!activeThread) {
      const response = await fetch("/api/v1/ai/coach/threads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({})
      });
      const payload = await response.json();
      if (!response.ok) {
        const code = payload?.error?.code ?? "INTERNAL_ERROR";
        setError(tErrors.has(code) ? tErrors(code) : tErrors("INTERNAL_ERROR"));
        return;
      }
      activeThread = payload.data.id as string;
      setThreadId(activeThread);
      setThreads((current) => [payload.data, ...current]);
    }

    setDraft("");
    setError(null);
    setStreaming(true);
    const tempUserId = `temp-user-${Date.now()}`;
    const tempAssistantId = `temp-assistant-${Date.now()}`;
    setMessages((current) => [
      ...current,
      {
        id: tempUserId,
        thread_id: activeThread!,
        role: "user",
        content,
        status: "complete",
        citations: null,
        feedback: null,
        created_at: new Date().toISOString()
      },
      {
        id: tempAssistantId,
        thread_id: activeThread!,
        role: "assistant",
        content: "",
        status: "streaming",
        citations: null,
        feedback: null,
        created_at: new Date().toISOString()
      }
    ]);

    const abort = new AbortController();
    abortRef.current = abort;
    let assistantId = tempAssistantId;
    let stopped = false;

    const patch = (update: Partial<Message>) => {
      setMessages((current) =>
        current.map((message) => (message.id === assistantId ? { ...message, ...update } : message))
      );
    };
    const append = (text: string) => {
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId ? { ...message, content: message.content + text } : message
        )
      );
    };

    try {
      const response = await fetch(
        `/api/v1/ai/coach/threads/${activeThread}/messages`,
        {
          method: "POST",
          headers: { "content-type": "application/json", accept: "text/event-stream" },
          body: JSON.stringify({ content }),
          signal: abort.signal
        }
      );
      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => null);
        const code = payload?.error?.code ?? "AI_UNAVAILABLE";
        setError(tErrors.has(code) ? tErrors(code) : tErrors("AI_UNAVAILABLE"));
        setMessages((current) =>
          current.filter((message) => message.id !== tempAssistantId && message.id !== tempUserId)
        );
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() ?? "";
        for (const block of blocks) {
          const eventLine = block.split("\n").find((line) => line.startsWith("event:"));
          const dataLine = block.split("\n").find((line) => line.startsWith("data:"));
          if (!eventLine || !dataLine) continue;
          const eventName = eventLine.slice(6).trim();
          let data: Record<string, unknown>;
          try {
            data = JSON.parse(dataLine.slice(5).trim());
          } catch {
            continue;
          }
          if (eventName === "meta") {
            const nextId = String(data.message_id ?? "");
            if (nextId && nextId !== assistantId) {
              const previous = assistantId;
              assistantId = nextId;
              setMessages((current) =>
                current.map((message) =>
                  message.id === previous ? { ...message, id: nextId } : message
                )
              );
            }
            if (data.thread_id) {
              activeThread = String(data.thread_id);
            }
          } else if (eventName === "delta") {
            append(String(data.text ?? ""));
          } else if (eventName === "tool") {
            if (Array.isArray(data.cards)) {
              setMessages((current) =>
                current.map((message) =>
                  message.id === assistantId
                    ? { ...message, cards: data.cards as Card[] }
                    : message
                )
              );
            }
          } else if (eventName === "done") {
            const citations = Array.isArray(data.citations)
              ? (data.citations as Citation[])
              : null;
            patch({ status: "complete", citations });
            setQuota((current) =>
              current
                ? {
                    remaining_hour: Math.max(0, current.remaining_hour - 1),
                    remaining_day: Math.max(0, current.remaining_day - 1)
                  }
                : current
            );
          } else if (eventName === "error") {
            patch({ status: "error" });
          }
        }
      }
    } catch (caught) {
      stopped = caught instanceof Error && caught.name === "AbortError";
      if (!stopped) setError(tErrors("NETWORK_ERROR"));
    } finally {
      abortRef.current = null;
      setStreaming(false);
      const finalThread = activeThread;
      if (finalThread) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        await loadMessages(finalThread).catch(() => undefined);
        await loadThreads()
          .then(() => undefined)
          .catch(() => undefined);
      }
    }
  }

  function stop() {
    abortRef.current?.abort();
    abortRef.current = null;
  }

  async function feedback(message: Message, rating: 1 | -1) {
    const response = await fetch(`/api/v1/ai/coach/messages/${message.id}/feedback`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rating })
    });
    if (response.ok) {
      setMessages((current) =>
        current.map((row) => (row.id === message.id ? { ...row, feedback: rating } : row))
      );
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>;

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-2">
        <button
          type="button"
          onClick={newThread}
          className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
        >
          {t("newThread")}
        </button>
        {quota ? (
          <p className="text-xs text-muted-foreground">
            {t("quota", { hour: quota.remaining_hour, day: quota.remaining_day })}
          </p>
        ) : null}
        <ul className="max-h-[60vh] space-y-1 overflow-y-auto">
          {threads.map((thread) => (
            <li key={thread.id} className="group flex items-center gap-1">
              <button
                type="button"
                onClick={() => selectThread(thread.id)}
                className={`min-w-0 flex-1 truncate rounded-lg px-2 py-2 text-left text-sm ${
                  thread.id === threadId ? "bg-card font-medium" : "text-muted-foreground"
                }`}
              >
                {thread.title ?? t("untitled")}
              </button>
              <button
                type="button"
                onClick={() => deleteThread(thread.id)}
                aria-label={t("delete")}
                className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="flex min-h-[60vh] flex-col rounded-xl border border-border bg-card">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {!messages.length ? (
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>{t("emptyTitle")}</p>
              <p>{t("emptyHint")}</p>
            </div>
          ) : null}
          {messages.map((message) => (
            <article
              key={message.id}
              className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                message.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-background"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content || (message.status === "streaming" ? "…" : "")}</p>
              {message.status === "aborted" ? (
                <p className="mt-1 text-xs text-muted-foreground">{t("stopped")}</p>
              ) : null}
              {message.cards?.length ? (
                <div className="mt-2 grid gap-1">
                  {message.cards.map((card) => (
                    <div key={card.id} className="rounded-lg border border-border p-2 text-xs">
                      <p className="font-medium">{card.name}</p>
                      <p className="text-muted-foreground">
                        {card.muscle} · {card.equipment.join(", ")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
              {message.citations?.length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {message.citations.map((citation) => (
                    <span
                      key={`${citation.type}:${citation.ref_id}`}
                      className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {t("source")}: {citation.label}
                    </span>
                  ))}
                </div>
              ) : null}
              {message.role === "assistant" && message.status !== "streaming" ? (
                <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => feedback(message, 1)}
                    className={message.feedback === 1 ? "font-semibold" : ""}
                    aria-label={t("helpful")}
                  >
                    👍
                  </button>
                  <button
                    type="button"
                    onClick={() => feedback(message, -1)}
                    className={message.feedback === -1 ? "font-semibold" : ""}
                    aria-label={t("notHelpful")}
                  >
                    👎
                  </button>
                </div>
              ) : null}
            </article>
          ))}
          <div ref={bottomRef} />
        </div>

        {error ? <p className="px-4 pb-2 text-sm text-danger">{error}</p> : null}
        <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={2}
            maxLength={4000}
            placeholder={t("placeholder")}
            className="min-h-10 flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          {streaming ? (
            <button
              type="button"
              onClick={stop}
              className="rounded-lg border border-danger px-3 py-2 text-sm text-danger"
            >
              {t("stop")}
            </button>
          ) : (
            <button
              type="submit"
              disabled={!draft.trim()}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {t("send")}
            </button>
          )}
        </form>
      </section>
    </div>
  );
}
