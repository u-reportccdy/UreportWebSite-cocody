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

export const fetchArticle = async (articleId: string) => {
  const response = await api.get(`/articles/${articleId}`);
  return response.data.data;
};

/**
 * @desc Create a new article
 */
export const createArticle = async (articleData: any) => {
  const response = await api.post('/articles', articleData);
  return response.data.data;
};

export const updateArticle = async (articleId: string, articleData: any) => {
  const response = await api.patch(`/articles/${articleId}`, articleData);
  return response.data.data;
};

export const deleteArticle = async (articleId: string) => {
  await api.delete(`/articles/${articleId}`);
};
