import React, { useMemo, useState } from 'react';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Share2 } from 'lucide-react';

interface ShareDrawerProps {
  open: boolean;
  onClose: () => void;
  referralCode?: string;
}

export const ShareDrawer: React.FC<ShareDrawerProps> = ({ open, onClose, referralCode }) => {
  const [copyMessage, setCopyMessage] = useState('');
  const inviteLink = useMemo(() => {
    if (!referralCode) return window.location.origin;
    return `${window.location.origin}/?ref=${referralCode}`;
  }, [referralCode]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage('Copié !');
      setTimeout(() => setCopyMessage(''), 2000);
    } catch {
      setCopyMessage('Impossible de copier');
      setTimeout(() => setCopyMessage(''), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      handleCopy(inviteLink);
      return;
    }
    try {
      await navigator.share({
        title: 'Rejoins FrancPay',
        text: 'Découvre FrancPay et connecte ton wallet.',
        url: inviteLink,
      });
    } catch {
      // ignore annulations
    }
  };

  return (
    <Drawer open={open} onOpenChange={(value) => !value && onClose()}>
      <DrawerContent className="h-[60vh] bg-slate-950 text-white border-slate-800">
        <DrawerHeader>
          <DrawerTitle>Partager FrancPay</DrawerTitle>
          <DrawerDescription className="text-slate-400">
            Invite un ami via ton code parrainage ou en partageant le lien.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 py-4 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-1">Code parrainage</p>
            <div className="flex gap-2">
              <Input value={referralCode || 'Non disponible'} readOnly className="bg-slate-900 border-slate-800" />
              <Button variant="outline" className="border-slate-700 text-white" onClick={() => handleCopy(referralCode || '')}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-1">Lien d'invitation</p>
            <div className="flex gap-2">
              <Input value={inviteLink} readOnly className="bg-slate-900 border-slate-800" />
              <Button variant="outline" className="border-slate-700 text-white" onClick={() => handleCopy(inviteLink)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {copyMessage && <p className="text-xs text-emerald-400">{copyMessage}</p>}
          <Button className="w-full rounded-2xl bg-emerald-500/90 text-slate-900 font-semibold" onClick={handleNativeShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Partager sur les réseaux
          </Button>
        </div>
        <DrawerClose className="absolute top-4 right-4 text-slate-500 hover:text-white">X</DrawerClose>
      </DrawerContent>
    </Drawer>
  );
};
