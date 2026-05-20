import React from 'react';
import { motion } from 'framer-motion';
import { ClockIcon, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { stripRichText } from '../../utils/richText';

interface RecentArticlesProps {
  articles?: any[];
}



export function RecentArticles({ articles }: RecentArticlesProps) {
  const list = articles || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-[#1E293B]">Derniers Articles Rédigés</h2>
        <a href="/admin/articles" className="text-xs font-bold text-[#0099DC] hover:text-white hover:bg-[#0099DC] transition-all px-3 py-1 rounded-full border border-[#0099DC]/20">
          Voir tout
        </a>
      </div>

      <div className="flex-1">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500 font-medium space-y-2">
            <FileText className="w-10 h-10 text-gray-300" />
            <p className="text-sm font-semibold text-gray-700">Aucun article disponible</p>
            <p className="text-xs text-gray-400">Rédigez un article dans la section "Articles" pour alimenter le blog.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {list.map((article) => {
              const formattedDate = new Date(article.date || article.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              });

              return (
                <div
                  key={article.id}
                  className="group cursor-pointer border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-all"
                >
                  <div className="h-32 w-full overflow-hidden relative bg-gray-100">
                    {article.image ? (
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-55 flex-col space-y-1 text-gray-400">
                        <FileText className="w-6 h-6" />
                        <span className="text-[10px]">Pas d'image</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 uppercase">
                        {article.category || 'Actualité'}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center text-[10px] text-gray-400 mb-1">
                      <ClockIcon className="w-3 h-3 mr-1" />
                      {formattedDate}
                    </div>
                    <h3 className="font-bold text-[#1E293B] text-sm mb-1 line-clamp-1 group-hover:text-[#0099DC] transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-[11px] text-[#64748B] line-clamp-2">
                      {stripRichText(article.summary || article.content || 'Pas de résumé disponible.')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

