import React, { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { Construction } from 'lucide-react';
import { PATHS } from '../../routes/paths';
import { loadMemberSession } from '../../utils/memberSession';

interface MemberSession {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
}

export function CotisationPayment() {
  const session = useMemo<MemberSession | null>(() => loadMemberSession(), []);

  if (!session) {
    return <Navigate to={PATHS.PUBLIC.HOME} replace />;
  }

  return (
    <section className="py-12 px-4 bg-gradient-to-b from-white to-blue-50/40 min-h-[75vh]">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-blue-100 shadow-lg overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80"
          alt="Paiement en construction"
          className="w-full h-64 md:h-80 object-cover"
        />
        <div className="p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-100 mx-auto flex items-center justify-center mb-4">
            <Construction className="w-7 h-7 text-amber-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Paiement en construction</h1>
          <p className="text-gray-600 text-base">
            Le module de paiement de cotisation sera disponible dans une prochaine mise à jour.
          </p>
        </div>
      </div>
    </section>
  );
}
