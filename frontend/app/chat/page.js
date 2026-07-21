"use client";

import { useUser } from "@/app/hooks/useUser";
import { apiGet, apiPost } from "@/app/utils/api";
import Skeleton from "@/app/components/Skeleton";
import { useError } from "@/app/contexts/ErrorContext";
import { useEffect, useRef, useState } from "react";
import { boostGrid } from "@/app/components/GridBackground";

export default function ChatPage() {
  const { user, loading } = useUser("/login");
  const [documents, setDocuments] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [activeConv, setActiveConv] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const { addToast } = useError();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!user) return;

    apiGet("/api/v1/documents/")
      .then((data) => setDocuments(data.documents || []))
      .catch(() => addToast("Erreur de chargement des documents", "error"));

    apiGet("/api/v1/chat/conversations/")
      .then((data) => setConversations(data.conversations || []))
      .catch(() => addToast("Erreur de chargement des conversations", "error"));
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSelectDocument = async (docId) => {
    setSelectedDoc(docId);
    setMessages([]);
    setActiveConv(null);
    setConversationId(null);

    const existingConv = conversations.find((c) => c.document_id === docId);

    if (existingConv) {
      setActiveConv(existingConv);
      setConversationId(existingConv.id);

      try {
        const data = await apiGet(
          `/api/v1/chat/conversations/${existingConv.id}/messages`
        );
        setMessages(data.messages || []);
      } catch {
        addToast("Impossible de charger les messages", "error");
      }
    } else {
      try {
        const data = await apiPost("/api/v1/chat/conversations", {
          document_id: docId,
        });
        setConversationId(data.conversation_id);
        setConversations((prev) => [
          {
            id: data.conversation_id,
            document_id: docId,
            created_at: data.created_at,
          },
          ...prev,
        ]);
      } catch {
        addToast("Impossible de créer la conversation", "error");
      }
    }
  };

  const sendQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim() || !conversationId) return;

    setSending(true);
    boostGrid(0.6, 0);
    const userMsg = {
      role: "user",
      content: question,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    const currentQuestion = question;
    setQuestion("");

    try {
      const data = await apiPost("/api/v1/chat/query", {
        question: currentQuestion,
        conversation_id: conversationId,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          sources: data.sources,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch {
      addToast(
        "Impossible d'obtenir une réponse. Vérifie que le backend est lancé.",
        "error"
      );
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Erreur : impossible d'obtenir une réponse. Vérifie que le backend est lancé.",
          created_at: new Date().toISOString(),
        },
      ]);
    }

    setSending(false);
    boostGrid(0, 0);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 pt-20 flex flex-col h-[calc(100vh-80px)]">
        <div className="bg-dq-surface rounded-xl border border-dq-border p-4 mb-4">
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-10 w-full rounded" />
        </div>
        <div className="flex-1 bg-dq-surface rounded-xl border border-dq-border p-4 mb-4">
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-12 flex-1 rounded" />
          <Skeleton className="h-12 w-24 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 pt-20 flex flex-col h-[calc(100vh-80px)]">
      {/* Selector */}
      <div className="bg-dq-surface rounded-xl border border-dq-border p-4 mb-4">
        <h1 className="font-display text-xl font-semibold mb-2 text-dq-text">
          Chat avec tes documents
        </h1>

        <select
          onChange={(e) => handleSelectDocument(e.target.value)}
          className="w-full p-2 rounded bg-dq-bg border border-dq-border text-dq-text focus:outline-none focus:border-dq-accent transition-colors"
          value={selectedDoc || ""}
        >
          <option value="">Sélectionne un document</option>
          {documents.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.filename}
            </option>
          ))}
        </select>

        {selectedDoc && activeConv && (
          <p className="text-xs text-dq-text-muted mt-2 font-mono">
            Reprise de la conversation du{" "}
            {new Date(activeConv.created_at).toLocaleString("fr-FR")}
          </p>
        )}

        {!documents.length && (
          <p className="text-sm text-dq-text-muted mt-2">
            Aucun document trouvé.{" "}
            <a
              href="/upload"
              className="text-dq-accent hover:text-dq-accent-hover transition-colors"
            >
              Uploader un PDF
            </a>
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 bg-dq-surface rounded-xl border border-dq-border p-4 mb-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-dq-text-muted text-center py-12">
            {selectedDoc
              ? "Pose ta première question sur ce document."
              : "Sélectionne un document pour commencer."}
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`mb-4 p-4 rounded-lg ${
                  msg.role === "user"
                    ? "bg-dq-accent/10 border border-dq-accent/20 sm:ml-8"
                    : "bg-dq-bg border border-dq-border sm:mr-8"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-dq-text">
                    {msg.role === "user" ? "Vous" : "Assistant"}
                  </p>
                  {msg.created_at && (
                    <span className="text-xs text-dq-text-muted font-mono">
                      {new Date(msg.created_at).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-dq-text">
                  {msg.content}
                </p>
                {msg.sources && msg.sources.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs text-dq-text-muted cursor-pointer font-mono">
                      Sources ({msg.sources.length})
                    </summary>
                    {msg.sources.map((s, j) => (
                      <p
                        key={j}
                        className="text-xs text-dq-text-muted mt-1 font-mono"
                      >
                        Page {s.page} — similarité: {s.similarity}
                      </p>
                    ))}
                  </details>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={sendQuestion} className="flex gap-2">
        <input
          type="text"
          placeholder={
            conversationId
              ? "Pose ta question..."
              : "Sélectionne d'abord un document"
          }
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={!conversationId || sending}
          className="flex-1 p-3 rounded bg-dq-surface border border-dq-border text-dq-text placeholder-dq-text-muted focus:outline-none focus:border-dq-accent transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!conversationId || !question.trim() || sending}
          className="px-6 py-3 bg-dq-accent text-dq-text rounded-lg hover:bg-dq-accent-hover transition-colors disabled:opacity-50 font-medium"
        >
          {sending ? "Envoi..." : "Envoyer"}
        </button>
      </form>
    </div>
  );
}
