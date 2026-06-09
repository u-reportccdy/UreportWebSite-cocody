import React from 'react';
import { motion } from 'framer-motion';
import { Construction } from 'lucide-react';

export function Newsletter() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-blue-100 shadow-lg overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1800&q=80"
          alt="Newsletter en construction"
          className="w-full h-72 object-cover"
        />
        <div className="p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-100 mx-auto flex items-center justify-center mb-4">
            <Construction className="w-7 h-7 text-amber-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Newsletter en construction</h1>
          <p className="text-gray-600 text-base">
            Cette section sera activée dans une prochaine mise à jour.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
