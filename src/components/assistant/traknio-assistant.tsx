"use client";

import Image from "next/image";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { LoadingSkeleton } from "@/src/components/ui/loading-skeleton";
import { PrimaryButton } from "@/src/components/ui/primary-button";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type AssistantApiResponse = {
  answer?: string;
  error?: "assistant_unavailable" | "auth_required" | "invalid_question" | "premium_required" | "rate_limited";
};

function getErrorMessage(error: AssistantApiResponse["error"]) {
  if (error === "rate_limited") return "La limite quotidienne de messages est atteinte. Réessaie demain.";
  if (error === "premium_required") return "Cette aide est disponible avec ton accès Premium.";
  if (error === "auth_required") return "Reconnecte-toi pour utiliser l’aide Traknio.";
  if (error === "invalid_question") return "Écris une question un peu plus précise.";
  return "L’aide Traknio est indisponible pour le moment. Réessaie dans quelques instants.";
}

function Avatar({ compact = false }: { compact?: boolean }) {
  const [fallback, setFallback] = useState(false);
  return (
    <span className={`traknio-assistant-avatar ${compact ? "traknio-assistant-avatar--compact" : ""}`}>
      <Image
        src={fallback ? "/brand/traknio-logo-mark-exact.png" : "/brand/traknio-assistant-avatar.png"}
        alt=""
        width={compact ? 52 : 72}
        height={compact ? 52 : 72}
        className="traknio-assistant-avatar__image"
        onError={() => setFallback(true)}
      />
    </span>
  );
}

export function TraknioAssistant() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [openedForPath, setOpenedForPath] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messageId = useRef(0);

  const shouldHide = pathname === "/watch" || pathname.startsWith("/workout");

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 100);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  if (shouldHide) return null;

  const panelOpen = isOpen && openedForPath === pathname;

  function nextMessageId() {
    messageId.current += 1;
    return `assistant-message-${messageId.current}`;
  }

  async function sendQuestion(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const content = question.trim();
    if (!content || isSending) return;

    setQuestion("");
    setError(null);
    setMessages((current) => [...current, { id: nextMessageId(), role: "user", content }]);
    setIsSending(true);
    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: content, routeContext: pathname }),
      });
      const payload = await response.json().catch(() => ({})) as AssistantApiResponse;
      const answer = payload.answer;
      if (!response.ok || !answer) {
        setError(getErrorMessage(payload.error));
        return;
      }
      setMessages((current) => [...current, { id: nextMessageId(), role: "assistant", content: answer }]);
    } catch {
      setError(getErrorMessage("assistant_unavailable"));
    } finally {
      setIsSending(false);
    }
  }

  function onQuestionKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") void sendQuestion();
  }

  return (
    <aside className={`traknio-assistant ${panelOpen ? "is-open" : ""}`} aria-label="Assistant Traknio">
      <button
        type="button"
        className="traknio-assistant-trigger"
        aria-label="Ouvrir l’assistant Traknio"
        aria-expanded={panelOpen}
        onClick={() => {
          setOpenedForPath(pathname);
          setIsOpen(true);
        }}
      >
        <Avatar />
        <span className="traknio-assistant-trigger__signal" aria-hidden="true" />
      </button>

      {panelOpen ? (
        <section className="traknio-assistant-panel" role="dialog" aria-modal="false" aria-labelledby="traknio-assistant-title">
          <header className="traknio-assistant-panel__header">
            <Avatar compact />
            <div className="traknio-assistant-panel__identity">
              <h2 id="traknio-assistant-title">Assistant Traknio</h2>
              <p><span aria-hidden="true" />Aide Traknio</p>
            </div>
            <button type="button" className="traknio-assistant-close" aria-label="Fermer l’assistant" onClick={() => setIsOpen(false)}>
              <span aria-hidden="true" />
            </button>
          </header>

          <div className="traknio-assistant-panel__messages" aria-live="polite">
            {messages.length === 0 && !isSending ? (
              <div className="traknio-assistant-empty">
                <p>Une question sur l’utilisation de Traknio ?</p>
                <span>Programmes, séance, montre, repos ou progression.</span>
              </div>
            ) : null}
            {messages.map((message) => (
              <div key={message.id} className={`traknio-assistant-message traknio-assistant-message--${message.role}`}>
                {message.role === "assistant" ? <Avatar compact /> : null}
                <p>{message.content}</p>
              </div>
            ))}
            {isSending ? (
              <div className="traknio-assistant-message traknio-assistant-message--assistant" aria-label="Réponse en cours">
                <Avatar compact />
                <div className="traknio-assistant-loading"><LoadingSkeleton lines={1} /></div>
              </div>
            ) : null}
            {error ? <p className="traknio-assistant-error" role="alert">{error}</p> : null}
          </div>

          <form className="traknio-assistant-form" onSubmit={sendQuestion}>
            <input
              ref={inputRef}
              type="text"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={onQuestionKeyDown}
              maxLength={600}
              disabled={isSending}
              placeholder="Pose ta question..."
              aria-label="Ta question pour l’assistant Traknio"
            />
            <PrimaryButton type="submit" fullWidth={false} className="traknio-assistant-send" disabled={!question.trim() || isSending} aria-label="Envoyer la question">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m21 3-7.5 18-3.7-7.8L2 9.5 21 3Zm-9.4 9.3 1.8 3.8 3.8-9.1-9.1 3.8 3.5 1.7Z" /></svg>
            </PrimaryButton>
          </form>
        </section>
      ) : null}
    </aside>
  );
}
