import { Outlet, ScrollRestoration } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Navbar } from '../components/public/Navbar';
import { Footer } from '../components/public/Footer';
import { fetchSiteSettings } from '../services/content.service';

type MaintenanceState = {
  loading: boolean;
  active: boolean;
  message: string;
  imageUrl: string;
};

export function PublicLayout() {
  const [maintenance, setMaintenance] = useState<MaintenanceState>({
    loading: true,
    active: false,
    message: 'Le site est temporairement en maintenance.',
    imageUrl: '/images/logo-512.png',
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const settings = await fetchSiteSettings();
        if (!alive) return;
        setMaintenance({
          loading: false,
          active: !!settings?.site_under_maintenance,
          message: settings?.maintenance_message || 'Le site est temporairement en maintenance.',
          imageUrl: settings?.maintenance_image_url || '/images/logo-512.png',
        });
      } catch {
        if (!alive) return;
        setMaintenance(prev => ({ ...prev, loading: false }));
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (maintenance.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-700">
        Chargement...
      </div>
    );
  }

  if (maintenance.active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] px-4">
        <div className="w-full max-w-xl bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
          <img src={maintenance.imageUrl} alt="Maintenance" className="w-24 h-24 object-contain mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Site en maintenance</h1>
          <p className="text-gray-700">{maintenance.message || 'Le site est actuellement en maintenance. Veuillez revenir plus tard.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50 text-gray-900">
      <ScrollRestoration />
      <Navbar />
      <main className="flex-grow pt-20">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
