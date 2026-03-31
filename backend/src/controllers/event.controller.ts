import { Request, Response } from 'express';

/**
 * @desc Get all events
 * @route GET /api/events
 */
export const getEvents = async (req: Request, res: Response) => {
  try {
    const mockEvents = [
      { id: 1, title: 'Journée de sensibilisation', location: 'Université FHB' },
      { id: 2, title: 'Campagne de propreté', location: 'Mairie de Cocody' }
    ];

    res.status(200).json({
      status: 'success',
      data: mockEvents
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des événements'
    });
  }
};
