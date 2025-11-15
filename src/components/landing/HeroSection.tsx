import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Coins } from 'lucide-react';

interface HeroSectionProps {
  onConnexion: () => void;
  onInscription: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onConnexion,
  onInscription,
}) => {
  return (
    <section className="h-screen flex flex-col justify-between px-4 py-8 md:py-12 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center max-w-md mx-auto w-full text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs">
            <Coins className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 font-medium">Franc Numérique • FRE</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight">
            <span className="bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              FrancPay
            </span>
            <br />
            <span className="text-2xl text-slate-300 font-normal">
              L'avenir mobile du Franc Numérique
            </span>
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Envoyez, recevez et gérez vos <span className="text-emerald-400 font-semibold">FRE</span> depuis votre smartphone.
            Interface légère, authentification instantanée, paiements optimisés.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col gap-3"
        >
          <Button
            size="lg"
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white rounded-full"
            onClick={onConnexion}
          >
            Connexion
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full border-slate-700 text-slate-200 hover:bg-slate-800 rounded-full"
            onClick={onInscription}
          >
            Inscription
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="flex flex-col items-center gap-2 text-xs text-slate-500 pt-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-slate-800 rounded-full bg-slate-900/60 text-sm text-slate-200">
            <span className="inline-block w-4 h-4 rounded-md bg-gradient-to-r from-emerald-500 to-blue-500" />
            FrancPay
          </div>
          <p>© 2025 FrancPay. Powered by TON Blockchain.</p>
        </motion.div>
      </div>
    </section>
  );
};
