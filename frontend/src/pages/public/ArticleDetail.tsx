import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Share2 } from 'lucide-react';
import { Link } from '../../components/public/Link';
import { fetchArticle } from '../../services/article.service';
import { cleanRichHtml, stripRichText } from '../../utils/richText';



export function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadArticle = async () => {
      if (!id) return;
      setIsLoading(true);
      setError('');
      try {
        const row = await fetchArticle(id);
        setArticle({
          ...row,
          image: row.image || row.image_url,
          date: row.date || row.published_at || row.created_at,
        });
      } catch (err) {
        console.error('Erreur chargement article:', err);
        setError('Article introuvable');
      } finally {
        setIsLoading(false);
      }
    };

    loadArticle();
  }, [id]);

  if (isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-gray-500">Chargement de l'article...</div>;
  }

  if (error || !article) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Article introuvable</h2>
        <Link href="/articles" className="text-ureport-blue hover:underline">Retour aux articles</Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <Link href="/articles" className="inline-flex items-center text-gray-500 hover:text-ureport-blue transition-colors font-semibold mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Tous les articles
        </Link>

        <div className="mb-6">
          <span className="text-ureport-gold font-bold tracking-wider uppercase text-sm">{article.category}</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-heading font-bold text-ureport-dark mb-8 leading-tight">{article.title}</h1>

        <div className="flex items-center justify-between py-6 border-y border-gray-100 mb-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center text-gray-600">
              <User className="w-5 h-5 mr-2 text-gray-400" />
              <span className="font-medium">{article.author}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Calendar className="w-5 h-5 mr-2 text-gray-400" />
              <span>{article.date ? new Date(article.date).toLocaleDateString('fr-FR') : ''}</span>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-ureport-blue hover:text-white transition-colors text-gray-600">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="aspect-[21/9] rounded-3xl overflow-hidden shadow-lg bg-gray-100">
          {article.image && <img src={article.image} alt={article.title} className="w-full h-full object-cover" />}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="prose prose-lg prose-blue max-w-none">
          <p className="text-xl text-gray-600 font-medium leading-relaxed mb-8 border-l-4 border-ureport-blue pl-6 py-2 bg-ureport-light/30 rounded-r-xl">
            {stripRichText(article.excerpt || '')}
          </p>
          <div className="text-gray-800 leading-relaxed quill-content space-y-4" dangerouslySetInnerHTML={{ __html: cleanRichHtml(article.content || '') }} />
        </div>
      </div>
    </div>
  );
}

