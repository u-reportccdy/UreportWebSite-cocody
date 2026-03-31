import api from './api';

/**
 * @desc Get all articles from API
 */
export const fetchArticles = async () => {
  try {
    const response = await api.get('/articles');
    return response.data.data;
  } catch (error) {
    console.error('Erreur API Articles:', error);
    throw error;
  }
};

/**
 * @desc Create a new article
 */
export const createArticle = async (articleData: any) => {
  const response = await api.post('/articles', articleData);
  return response.data.data;
};
