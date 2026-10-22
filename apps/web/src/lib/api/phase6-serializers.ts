import type {
  AiRecommendation,
  ChatMessage,
  ChatThread,
  Export,
  Notification
} from "@gymapps/db";

export function serializeThread(thread: ChatThread) {
  return {
    id: thread.id,
    title: thread.title,
    program_id: thread.programId,
    message_count: thread.messageCount,
    last_message_at: thread.lastMessageAt?.toISOString() ?? null,
    created_at: thread.createdAt.toISOString()
  };
}

export function serializeMessage(message: ChatMessage) {
  return {
    id: message.id,
    thread_id: message.threadId,
    role: message.role,
    content: message.content,
    status: message.status,
    citations: message.citations ?? null,
    feedback: message.feedback,
    created_at: message.createdAt.toISOString()
  };
}

export function serializeRecommendation(row: AiRecommendation) {
  return {
    id: row.id,
    rule: row.rule,
    severity: row.severity,
    title: row.title,
    body: row.body,
    evidence: row.evidence,
    action_type: row.actionType,
    action_payload: row.actionPayload,
    status: row.status,
    dismissed_until: row.dismissedUntil?.toISOString() ?? null,
    expires_at: row.expiresAt?.toISOString() ?? null,
    created_at: row.createdAt.toISOString()
  };
}

export function serializeExport(row: Export) {
  return {
    export_id: row.id,
    status: row.status,
    type: row.type,
    expires_at: row.expiresAt?.toISOString() ?? null,
    file_size_bytes: row.fileSizeBytes,
    error_message: row.errorMessage,
    created_at: row.createdAt.toISOString()
  };
}

export function serializeNotification(row: Notification) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    link: row.link,
    read_at: row.readAt?.toISOString() ?? null,
    created_at: row.createdAt.toISOString()
  };
}
