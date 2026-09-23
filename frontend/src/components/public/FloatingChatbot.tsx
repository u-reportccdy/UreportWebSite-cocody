import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Sparkles, ChevronRight, HelpCircle } from 'lucide-react';
import { Link } from './Link';
import { PATHS } from '../../routes/paths';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  quickReplies?: { label: string; action: string }[];
}

export const FloatingChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialMessages: Message[] = [
    {
      id: '1',
      sender: 'bot',
      text: "Bonjour ! 👋 Je suis l'Assistant Virtuel de U-Report Cocody. Comment puis-je vous aider aujourd'hui ?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quickReplies: [
        { label: " Comment s'inscrire ?", action: 'how_to_join' },
        { label: "📅 Prochains événements", action: 'events_info' },
        { label: "💳 Payer ma cotisation", action: 'cotisation_info' },
        { label: "📞 Nous contacter", action: 'contact_info' },
      ],
    },
  ];

  const [messages, setMessages] = useState<Message[]>(initialMessages);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsTyping(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const botMsg: Message = {
        id: Date.now().toString(),
        sender: 'bot',
        text: data.reply || "Je n'ai pas pu traiter votre demande. Réessayez !",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        sender: 'bot',
        text: "Je suis momentanément hors ligne. Contactez-nous à ureportcocody01@hotmail.com ! 😊",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickReply = (_action: string, label: string) => {
    handleSendMessage(label);
  };

  return (
    <div className="fixed bottom-5 right-5 z-[9997]">
      {/* BOUTON FLOTTANT D'OUVERTURE DU CHAT */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setIsOpen(true)}
          className="relative group flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-[#0099DC] to-[#007BB5] text-white shadow-2xl shadow-ureport-blue/40 hover:shadow-ureport-blue/60 transition-all cursor-pointer"
          aria-label="Ouvrir l'assistant virtuel"
        >
          {/* Onde d'impulsion lumineuse */}
          <span className="absolute inset-0 rounded-full bg-[#0099DC] animate-ping opacity-25 pointer-events-none" />
          
          <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8" />
          
          {/* Badge "En Ligne" */}
          <span className="absolute top-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
        </motion.button>
      )}

      {/* FENÊTRE DU CHATBOT DEPLIANTE */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-[calc(100vw-2.5rem)] sm:w-96 h-[520px] max-h-[80vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
          >
            {/* EN-TÊTE DU CHATBOT */}
            <div className="bg-gradient-to-r from-[#0099DC] to-[#007BB5] p-4 text-white flex items-center justify-between shrink-0 shadow-md">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                  <Bot className="w-6 h-6 text-white" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border border-white rounded-full" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                    Assistant U-Report
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  </h3>
                  <p className="text-[11px] text-blue-100 font-medium">
                    En ligne • Support U-Report Cocody
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/20 text-white/90 transition-colors"
                aria-label="Fermer le chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ZONE DES MESSAGES */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#0099DC] text-white rounded-br-none shadow-md shadow-ureport-blue/20'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <span
                      className={`block text-[10px] mt-1 text-right ${
                        msg.sender === 'user' ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* BOUTONS DE RÉPONSES RAPIDES */}
                  {msg.quickReplies && msg.quickReplies.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5 max-w-[90%]">
                      {msg.quickReplies.map((reply, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickReply(reply.action, reply.label)}
                          className="text-[11px] font-semibold py-1.5 px-3 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-ureport-blue dark:text-cyan-400 border border-ureport-blue/30 dark:border-cyan-500/30 rounded-xl transition-all shadow-sm active:scale-95"
                        >
                          {reply.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* SIMULATION BOT QUI TAPE */}
              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-slate-400 bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none w-fit border border-slate-200 dark:border-slate-700 shadow-sm">
                  <Bot className="w-4 h-4 text-ureport-blue animate-pulse" />
                  <span>L'assistant écrit...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ZONE DE SAISIE DE MESSAGE */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700/80 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Posez votre question..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white placeholder-slate-400 text-xs rounded-2xl focus:outline-none focus:ring-2 focus:ring-ureport-blue border border-transparent transition-all"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="w-10 h-10 rounded-2xl bg-[#0099DC] hover:bg-[#0088CC] disabled:opacity-40 text-white flex items-center justify-center transition-all shrink-0 shadow-md shadow-ureport-blue/20"
                aria-label="Envoyer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
