import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, ExternalLink, Search } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { fetchGalleryAlbums } from '../../services/content.service';
import { useConfirm } from '../../components/ui/ConfirmDialog';

export function Gallery() {
  const confirm = useConfirm();
  const [albums, setAlbums] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadAlbums = async () => {
      try {
        const rows = await fetchGalleryAlbums();
        setAlbums(rows.map((album: any) => ({
          ...album,
          cover: album.cover || album.cover_url,
          date: album.date || album.event_date || album.created_at,
          external_link: album.external_link || '',
        })));
      } catch (err) {
        console.error('Erreur chargement galerie:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAlbums();
  }, []);

  const handleAlbumClick = async (album: any) => {
    if (album.external_link) {
      const ok = await confirm({
        title: 'Ouvrir l\'album externe ?',
        message: 'Vous allez être redirigé vers l\'album complet dans un nouvel onglet.',
        confirmText: 'Ouvrir',
      });
      if (ok) window.open(album.external_link, '_blank');
    } else {
      await confirm({
        title: 'Lien indisponible',
        message: 'Cet album n\'a pas encore de lien externe associé.',
        confirmText: 'Compris',
        cancelText: 'Fermer',
      });
    }
  };

  const displayedAlbums = [...albums]
    .filter((album) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        String(album.title || '').toLowerCase().includes(q) ||
        String(album.date || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const aTime = new Date(a.date || 0).getTime();
      const bTime = new Date(b.date || 0).getTime();
      return bTime - aTime;
    })
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-ureport-dark text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Camera className="w-12 h-12 mx-auto mb-6 text-ureport-blue" />
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">Galerie Photos</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">Revivez les moments forts de nos actions sur le terrain en images.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex justify-center mb-8">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher un album..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-gray-300 bg-gray-50 text-gray-900 placeholder:text-[#586A82] text-[15px] shadow-[0_2px_8px_rgba(15,23,42,0.08)] focus:outline-none focus:ring-2 focus:ring-ureport-blue focus:border-transparent"
            />
          </div>
        </div>
        {isLoading && <div className="text-center py-20 text-gray-500">Chargement de la galerie...</div>}
        {!isLoading && albums.length === 0 && <div className="text-center py-20 text-gray-500">Aucun album disponible pour le moment.</div>}
        {!isLoading && albums.length > 0 && displayedAlbums.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            Aucun résultat pour "{searchQuery}".
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayedAlbums.map((album, index) => (
            <motion.div key={album.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
              <div onClick={() => handleAlbumClick(album)} className="h-full block">
                <Card hover className="group cursor-pointer h-full flex flex-col relative overflow-hidden">
                  <div className="relative h-64 overflow-hidden">
                    {album.cover && <img src={album.cover} alt={album.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="flex items-center text-white/80 text-sm mb-2 font-medium">
                        <span>{album.date ? new Date(album.date).toLocaleDateString('fr-FR') : ''}</span>
                        {album.external_link && (
                          <>
                            <span className="mx-2">-</span>
                            <span className="flex items-center text-[#0099DC]"><ExternalLink className="w-4 h-4 mr-1" /> Voir l'album</span>
                          </>
                        )}
                      </div>
                      <h3 className="text-xl font-heading font-bold text-white group-hover:text-ureport-gold transition-colors">{album.title}</h3>
                    </div>
                  </div>
                </Card>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

