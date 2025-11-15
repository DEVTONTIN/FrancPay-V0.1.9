import React, { useEffect, useMemo, useState } from 'react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, RefreshCcw, ShieldCheck, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface DepositDrawerProps {
  open: boolean;
  onClose: () => void;
  depositTag?: string;
  onManualRefresh?: () => void;
}

const DEPOSIT_ADDRESS = 'UQCP0lUbs-Z5Q5saNmRH0WLqL8c0StIw0sGYlKcPdxuFMosC';

export const DepositDrawer: React.FC<DepositDrawerProps> = ({
  open,
  onClose,
  depositTag,
  onManualRefresh,
}) => {
  const [statusMessage, setStatusMessage] = useState('');

  const readableTag = depositTag || 'FRP-TAG';

  useEffect(() => {
    if (!open) {
      setStatusMessage('');
    }
  }, [open]);

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setStatusMessage('Copie dans le presse-papiers');
      setTimeout(() => setStatusMessage(''), 1600);
    } catch {
      setStatusMessage('Impossible de copier');
      setTimeout(() => setStatusMessage(''), 1600);
    }
  };

  const qrValue = useMemo(() => {
    const params = new URLSearchParams();
    params.set('text', readableTag);
    return `ton://transfer/${DEPOSIT_ADDRESS}?${params.toString()}`;
  }, [readableTag]);

  return (
    <Drawer open={open} onOpenChange={(value) => !value && onClose()}>
      <DrawerContent className="h-[90vh] bg-slate-950 text-white border-slate-800 max-w-2xl mx-auto">
        <DrawerHeader className="text-left space-y-1 pt-2 pb-1">
          <DrawerTitle>Ajouter des FRE</DrawerTitle>
          <DrawerDescription className="text-slate-400" />
        </DrawerHeader>

        <div className="px-4 pt-1 pb-4 space-y-4 text-sm">
          <div className="space-y-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3">
            <div className="flex items-center gap-2 text-emerald-300 text-[10px] uppercase tracking-[0.25em]">
              <QrCode className="h-4 w-4" />
              QR automatique
            </div>

            <div className="flex justify-center bg-white rounded-2xl p-2 max-w-[160px] mx-auto">
              <QRCodeSVG value={qrValue} size={140} />
            </div>
            <p className="text-[11px] text-emerald-200 text-center">
              Le QR inclut l adresse FrancPay et ton tag <span className="font-semibold">{readableTag}</span>.
            </p>

          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Tag unique FrancPay</p>
            <div className="flex gap-2">
              <Input readOnly value={readableTag} className="bg-slate-900 border-slate-800 text-white text-base" />
              <Button variant="outline" className="border-slate-700 text-white" onClick={() => handleCopy(readableTag)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[11px] text-slate-400">
              Chaque depot doit inclure ce tag (commentaire) pour garantir l attribution automatique.
            </p>
          </div>

          <div className="space-y-2 mt-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Adresse TON FrancPay</p>
            <div className="flex gap-2">
              <Input readOnly value={DEPOSIT_ADDRESS} className="bg-slate-900 border-slate-800 text-white text-[13px]" />
              <Button variant="outline" className="border-slate-700 text-white" onClick={() => handleCopy(DEPOSIT_ADDRESS)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[11px] text-slate-400">
              En cas d envoi manuel, ajoute ton tag dans la note. Sans TonConnect la detection prendra plus de temps.
            </p>
          </div>

          {statusMessage && (
            <p className="text-xs text-slate-400">{statusMessage}</p>
          )}
        </div>

        <DrawerClose className="absolute top-4 right-4 text-slate-500 hover:text-white">X</DrawerClose>
      </DrawerContent>
    </Drawer>
  );
};

