import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Newspaper, RefreshCw, Search } from 'lucide-react';
import { Link } from '../../components/public/Link';
import { Card } from '../../components/ui/Card';
import { fetchArticles } from '../../services/article.service';
import { stripRichText } from '../../utils/richText';

const categories = ['Tous', 'Engagement', 'Sante', 'Environnement', 'Guide'];

const normalizeCategory = (value = '') =>
  value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');



function ArticleSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
      <div className="h-56 bg-gray-200" />
      <div className="p-6 space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-6 bg-gray-200 rounded w-5/6" />
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded" />
          <div className="h-3 bg-gray-200 rounded w-4/5" />
        </div>
      </div>
    </div>
  );
}

export function Articles() {
  const [articles, setArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');

  async function loadArticles() {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetchArticles();
      setArticles((response || []).map((article: any) => ({
        ...article,
        image: article.image || article.image_url,
        date: article.date || article.published_at || article.created_at,
      })));
    } catch (err) {
      console.error('Erreur chargement articles:', err);
      setError("Les articles ne sont pas disponibles pour le moment. Veuillez reessayer plus tard.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadArticles();
  }, []);

  const filteredArticles = (activeCategory === 'Tous'
    ? articles
    : articles.filter(article => normalizeCategory(article.category) === normalizeCategory(activeCategory)))
    .filter((article) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        String(article.title || '').toLowerCase().includes(q) ||
        String(article.category || '').toLowerCase().includes(q) ||
        String(stripRichText(article.excerpt || article.content || '')).toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const aTime = new Date(a.date || 0).getTime();
      const bTime = new Date(b.date || 0).getTime();
      return bTime - aTime;
    })
    .slice(0, 10);
  const featuredArticle = filteredArticles[0];
  const secondaryArticles = filteredArticles.slice(1);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-ureport-dark mb-6">
            Actualites & Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Decouvrez les histoires inspirantes de notre communaute, nos guides
            pratiques et les retours sur nos actions.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex justify-center mb-6">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher un article..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-gray-300 bg-gray-50 text-gray-900 placeholder:text-[#586A82] text-[15px] shadow-[0_2px_8px_rgba(15,23,42,0.08)] focus:outline-none focus:ring-2 focus:ring-ureport-blue focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-12 justify-center">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all border ${
                activeCategory === cat
                  ? 'bg-ureport-dark text-white border-ureport-dark shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="space-y-10">
            <div className="flex flex-col items-center justify-center py-6 text-gray-500">
              <RefreshCw className="w-7 h-7 animate-spin text-ureport-blue mb-3" />
              <p className="text-sm font-semibold">Chargement des articles...</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <ArticleSkeleton />
              <ArticleSkeleton />
              <ArticleSkeleton />
            </div>
          </div>
        )}

        {!isLoading && error && (
          <div className="max-w-xl mx-auto bg-white border border-gray-100 rounded-2xl shadow-sm px-8 py-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-ureport-light text-ureport-blue flex items-center justify-center mx-auto mb-5">
              <Newspaper className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-heading font-bold text-ureport-dark mb-3">Articles indisponibles</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">{error}</p>
            <button
              type="button"
              onClick={loadArticles}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-ureport-blue text-white text-sm font-bold hover:bg-[#007bb5] transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reessayer
            </button>
          </div>
        )}

        {!isLoading && !error && filteredArticles.length === 0 && (
          <div className="max-w-xl mx-auto bg-white border border-gray-100 rounded-2xl shadow-sm px-8 py-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center mx-auto mb-5">
              <Newspaper className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-heading font-bold text-ureport-dark mb-3">Aucun article trouve</h2>
            <p className="text-gray-600 text-sm">
              {searchQuery.trim()
                ? `Aucun résultat pour "${searchQuery}".`
                : 'Aucun article ne correspond a cette categorie pour le moment.'}
            </p>
          </div>
        )}

        {!isLoading && !error && featuredArticle && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
            <Link href={featuredArticle.external_link || `/articles/${featuredArticle.id}`} className="group block">
              <Card hover className="overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-0">
                <div className="h-64 lg:h-auto relative overflow-hidden bg-gray-100">
                  {featuredArticle.image && (
                    <img src={featuredArticle.image} alt={featuredArticle.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  )}
                  <div className="absolute top-4 left-4 bg-ureport-blue text-white px-3 py-1 rounded-full text-sm font-bold">
                    A la une
                  </div>
                </div>
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <div className="text-sm text-ureport-gold font-bold mb-4 uppercase tracking-wider">
                    {featuredArticle.category}
                  </div>
                  <h2 className="text-3xl font-heading font-bold text-ureport-dark mb-4 group-hover:text-ureport-blue transition-colors">
                    {featuredArticle.title}
                  </h2>
                  <p className="text-gray-600 text-lg mb-8 line-clamp-3">
                    {stripRichText(featuredArticle.excerpt || featuredArticle.content)}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="font-semibold text-gray-900">{featuredArticle.author}</span>
                      <span className="mx-2">-</span>
                      <span>{featuredArticle.date ? new Date(featuredArticle.date).toLocaleDateString('fr-FR') : ''}</span>
                    </div>
                    <span className="text-ureport-blue font-semibold flex items-center group-hover:translate-x-2 transition-transform">
                      Lire <ArrowRight className="ml-2 w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {!isLoading && !error && secondaryArticles.map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={article.external_link || `/articles/${article.id}`} className="group block h-full">
                <Card hover className="h-full flex flex-col">
                  <div className="h-56 overflow-hidden relative bg-gray-100">
                    {article.image && (
                      <img src={article.image} alt={article.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    )}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-ureport-dark">
                      {article.category}
                    </div>
                  </div>
                  <div className="p-6 flex-grow flex flex-col">
                    <h3 className="text-xl font-heading font-bold text-ureport-dark mb-3 group-hover:text-ureport-blue transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 mb-6 line-clamp-3 text-sm flex-grow">
                      {stripRichText(article.excerpt || article.content)}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="text-sm text-gray-500">
                        {article.date ? new Date(article.date).toLocaleDateString('fr-FR') : ''}
                      </div>
                      <span className="text-ureport-blue font-semibold flex items-center text-sm group-hover:translate-x-1 transition-transform">
                        Lire <ArrowRight className="ml-1 w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

