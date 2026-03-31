import { Request, Response } from 'express';

/**
 * @desc Get all articles
 * @route GET /api/articles
 */
export const getArticles = async (req: Request, res: Response) => {
  try {
    // Liste temporaire pour l'instant (plus tard viendra de la DB)
    const mockArticles = [
      { id: 1, title: 'Impact de la jeunesse à Cocody', author: 'Admin' },
      { id: 2, title: 'Comment s\'engager localement', author: 'User' }
    ];

    res.status(200).json({
      status: 'success',
      data: mockArticles
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des articles'
    });
  }
};
