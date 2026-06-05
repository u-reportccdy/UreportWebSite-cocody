import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, XIcon } from 'lucide-react';
import { Button } from '../ui/Button';

interface WhatsAppRedirectModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonLabel: string;
  whatsappUrl: string;
}

export function WhatsAppRedirectModal({
  isOpen,
  onClose,
  title,
  message,
  buttonLabel,
  whatsappUrl,
}: WhatsAppRedirectModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          <div className="flex justify-between items-start p-6 border-b border-gray-100 bg-gray-50/50">
            <div className="pr-8">
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors">
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-700 whitespace-pre-line">{message}</p>
            <div className="flex gap-3 pt-1">
              <Button
                fullWidth
                onClick={() => {
                  if (whatsappUrl) window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
                  onClose();
                }}
                className="inline-flex items-center justify-center gap-2 !bg-[#25D366] hover:!bg-[#1fba57] !text-white"
              >
                <MessageCircle className="w-4 h-4" />
                {buttonLabel}
              </Button>
              <Button variant="outline" fullWidth onClick={onClose} className="!border-[#25D366] !text-[#25D366] hover:!bg-[#25D366]/10">
                Plus tard
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
