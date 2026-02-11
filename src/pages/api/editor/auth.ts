import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

export type EditorActor = {
  userId: string;
  role: string;
};

const toEditorActor = (
  token: Awaited<ReturnType<typeof getToken>>,
): EditorActor | null => {
  if (!token || typeof token === 'string') return null;

  const userId = typeof token.sub === 'string' ? token.sub.trim() : '';
  if (!userId) return null;
  const role = typeof token.role === 'string' ? token.role : 'player';
  return { userId, role };
};

const resolveEditorActor = async (
  req: NextApiRequest,
): Promise<EditorActor | null> => {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: false,
    });
    return toEditorActor(token);
  } catch (error) {
    console.warn('Failed to resolve editor actor', error);
    return null;
  }
};

export const requireEditorActor = async (
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<EditorActor | null> => {
  const actor = await resolveEditorActor(req);
  if (!actor) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  return actor;
};

export const canManagePack = (actor: EditorActor, ownerId: string): boolean => {
  return actor.role === 'admin' || actor.userId === ownerId;
};
