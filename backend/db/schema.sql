-- ROLE: Schéma complet de la base de données Supabase
--
-- Ce fichier contient toutes les instructions SQL pour créer
-- les tables, extensions, et politiques RLS nécessaires au projet.
--
-- À exécuter dans l'éditeur SQL de Supabase (Phase 2).

-- ========================================
-- EXTENSIONS
-- ========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ========================================
-- TABLE: documents
-- ========================================
-- Stocke les métadonnées de chaque PDF uploadé.
-- TTL: expires_at = now() + 1 heure

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================
-- TABLE: chunks
-- ========================================
-- Stocke les morceaux de texte extraits du PDF
-- et leurs embeddings vectoriels (384 dimensions).

CREATE TABLE chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(384) NOT NULL,
  page_number INT NOT NULL
);

-- ========================================
-- TABLE: conversations
-- ========================================
-- Stocke les sessions de chat.
-- TTL: expires_at = now() + 2 heures

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================
-- TABLE: messages
-- ========================================
-- Stocke chaque message dans une conversation.

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================
-- TABLE: usage
-- ========================================
-- Compteur de questions par jour par utilisateur.
-- Contrainte unique: une seule ligne par jour par user.

CREATE TABLE usage (
  user_id UUID NOT NULL REFERENCES auth.users(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  questions_count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

-- ========================================
-- INDEX
-- ========================================

CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_expires_at ON documents(expires_at);
CREATE INDEX idx_chunks_document_id ON chunks(document_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_expires_at ON conversations(expires_at);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_usage_user_date ON usage(user_id, date);

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLICIES RLS
-- ========================================

-- Documents: un utilisateur ne voit que ses documents
CREATE POLICY "user_isolation" ON documents
FOR ALL USING (auth.uid() = user_id);

-- Chunks: un utilisateur ne voit que les chunks de ses documents
CREATE POLICY "user_isolation" ON chunks
FOR ALL USING (
  document_id IN (
    SELECT id FROM documents WHERE user_id = auth.uid()
  )
);

-- Conversations: un utilisateur ne voit que ses conversations
CREATE POLICY "user_isolation" ON conversations
FOR ALL USING (auth.uid() = user_id);

-- Messages: un utilisateur ne voit que les messages de ses conversations
CREATE POLICY "user_isolation" ON messages
FOR ALL USING (
  conversation_id IN (
    SELECT id FROM conversations WHERE user_id = auth.uid()
  )
);

-- Usage: un utilisateur ne voit que son compteur
CREATE POLICY "user_isolation" ON usage
FOR ALL USING (auth.uid() = user_id);

-- ========================================
-- FONCTIONS DE NETTOYAGE
-- ========================================

-- Supprime les documents expirés et leurs chunks/conversations/messages
CREATE OR REPLACE FUNCTION cleanup_expired_documents()
RETURNS void AS $$
BEGIN
  DELETE FROM chunks WHERE document_id IN (
    SELECT id FROM documents WHERE expires_at < now()
  );
  DELETE FROM documents WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Supprime les conversations expirées et leurs messages
CREATE OR REPLACE FUNCTION cleanup_expired_conversations()
RETURNS void AS $$
BEGIN
  DELETE FROM messages WHERE conversation_id IN (
    SELECT id FROM conversations WHERE expires_at < now()
  );
  DELETE FROM conversations WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;
