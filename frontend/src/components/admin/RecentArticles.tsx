import React from 'react';
import { motion } from 'framer-motion';
import { Edit3Icon, TrashIcon, PlusIcon, LinkIcon, ClockIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
const articles = [
{
  id: 1,
  title: "L'impact de la jeunesse à Cocody : Bilan 2024",
  category: 'Actualités',
  date: '14 Oct 2024',
  excerpt:
  'Découvrez comment les jeunes de Cocody transforment leur communauté à travers des actions concrètes...',
  image:
  'https://images.unsplash.com/photo-1529390079861-591de354faf5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  color: 'bg-blue-100 text-blue-700'
},
{
  id: 2,
  title: "Comment s'engager dans sa commune ?",
  category: 'Formation',
  date: '10 Oct 2024',
  excerpt:
  'Guide pratique pour les nouveaux U-Reporters qui souhaitent faire la différence au niveau local.',
  image:
  'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  color: 'bg-green-100 text-green-700'
},
{
  id: 3,
  title: 'Retour sur la journée de salubrité',
  category: 'Communauté',
  date: '05 Oct 2024',
  excerpt:
  'Plus de 200 jeunes se sont mobilisés ce weekend pour nettoyer les artères principales de la commune.',
  image:
  'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  color: 'bg-yellow-100 text-yellow-700'
},
{
  id: 4,
  title: 'Les nouveaux partenaires de U-Report',
  category: 'Actualités',
  date: '28 Sep 2024',
  excerpt:
  "Nous sommes fiers d'annoncer de nouvelles collaborations avec la Mairie et plusieurs ONG locales.",
  image:
  'https://images.unsplash.com/photo-1556761175-5973dc0f32d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  color: 'bg-blue-100 text-blue-700'
}];

export function RecentArticles() {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      transition={{
        duration: 0.4,
        delay: 0.5
      }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-[#1E293B]">Derniers Articles</h2>
        <Link to="/admin/articles" className="text-xs font-bold text-[#0099DC] hover:text-white hover:bg-[#0099DC] transition-all px-3 py-1 rounded-full border border-[#0099DC]/20">
          Voir tout
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {articles.map((article) =>
        <div
          key={article.id}
          className="group cursor-pointer border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-all">
          
            <div className="h-32 w-full overflow-hidden relative">
              <img
              src={article.image}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            
              <div className="absolute top-2 left-2">
                <span
                className={`text-xs font-semibold px-2 py-1 rounded-md ${article.color}`}>
                
                  {article.category}
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center text-xs text-gray-400 mb-2">
                <ClockIcon className="w-3 h-3 mr-1" />
                {article.date}
              </div>
              <h3 className="font-bold text-[#1E293B] text-sm mb-2 line-clamp-2 group-hover:text-[#0099DC] transition-colors">
                {article.title}
              </h3>
              <p className="text-xs text-[#64748B] line-clamp-2">
                {article.excerpt}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>);

}