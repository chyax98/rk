'use client';
import { useState, useCallback } from 'react';

export interface Comment {
  id: string;
  artifactId: string;
  blockId: string;
  text: string;
  selector?: { type: string; exact: string; prefix: string; suffix: string } | null;
  status: 'open' | 'resolved' | 'orphaned';
  createdAt: string;
}

export function useComments(artifactId: string, initial: Comment[]) {
  const [comments, setComments] = useState<Comment[]>(initial || []);

  const commentsFor = useCallback(
    (blockId: string) => comments.filter(c => c.blockId === blockId),
    [comments],
  );

  const blockCommentStatus = useCallback(
    (blockId: string): 'open' | 'orphaned' | 'resolved' | null => {
      const list = commentsFor(blockId);
      if (list.some(c => c.status === 'open')) return 'open';
      if (list.some(c => c.status === 'orphaned')) return 'orphaned';
      if (list.some(c => c.status === 'resolved')) return 'resolved';
      return null;
    },
    [commentsFor],
  );

  async function submitComment(blockId: string, text: string, selector: Comment['selector']) {
    if (!blockId || !text.trim()) return;
    const res = await fetch(`/api/artifacts/${artifactId}/comments`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ blockId, text, selector }),
    });
    const json = await res.json();
    if (json.ok) {
      setComments(prev => [...prev, json.comment]);
      return json.comment;
    }
    return null;
  }

  async function setCommentStatus(commentId: string, status: string) {
    const res = await fetch(`/api/artifacts/${artifactId}/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (json.ok) setComments(prev => prev.map(c => c.id === commentId ? json.comment : c));
  }

  return { comments, setComments, commentsFor, blockCommentStatus, submitComment, setCommentStatus };
}
