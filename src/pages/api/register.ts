import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';

import { prisma } from '../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { username, password } = req.body as {
    username?: string;
    password?: string;
  };

  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, error: 'Username and password are required' });
  }

  try {
    // name is not unique in the schema, so use findFirst for existence check
    const existing = await prisma.user.findFirst({
      where: { name: username },
      select: { id: true },
    });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, error: 'Username already exists' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const user = await prisma.user.create({
      data: {
        name: username,
        role: 'player',
        passwordHash,
      },
    });

    return res.status(201).json({
      success: true,
      user: { id: user.id, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error('Error registering user', err);
    return res
      .status(500)
      .json({ success: false, error: 'Internal server error' });
  }
}
