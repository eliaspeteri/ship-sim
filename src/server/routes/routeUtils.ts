import type { Request, Response } from 'express';

type AsyncRouteHandler = (req: Request, res: Response) => Promise<void>;

export const withErrorResponse = (
  failureMessage: string,
  handler: AsyncRouteHandler,
): AsyncRouteHandler => {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error(failureMessage, error);
      if (!res.headersSent) {
        res.status(500).json({ error: failureMessage });
      }
    }
  };
};
