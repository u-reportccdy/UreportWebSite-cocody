import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

type ConfirmContextType = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const close = (value: boolean) => {
    setOpen(false);
    if (resolver) resolver(value);
    setResolver(null);
  };

  const confirm = useCallback((nextOptions: ConfirmOptions) => {
    setOptions(nextOptions);
    setOpen(true);
    return new Promise<boolean>((resolve) => setResolver(() => resolve));
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {open && options && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.96 }}
              className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${options.danger ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#1E293B]">{options.title || 'Confirmation'}</h3>
              </div>
              <div className="px-6 py-5 text-sm text-[#475569] leading-relaxed">{options.message}</div>
              <div className="px-6 pb-6 flex justify-end gap-3">
                <button onClick={() => close(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold">
                  {options.cancelText || 'Annuler'}
                </button>
                <button
                  onClick={() => close(true)}
                  className={`px-4 py-2.5 rounded-xl text-white font-semibold ${options.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#0099DC] hover:bg-[#007bb5]'}`}
                >
                  {options.confirmText || 'Confirmer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used inside ConfirmDialogProvider');
  }
  return ctx.confirm;
}
