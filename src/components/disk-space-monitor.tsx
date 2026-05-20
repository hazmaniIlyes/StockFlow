// src/components/disk-space-monitor.tsx
// Listens for two types of disk-space alerts:
//  1. Proactive — 'disk:warning' IPC events pushed by the main process on startup / every 30min
//  2. Reactive  — 'db:disk-full' DOM CustomEvents dispatched by withDiskCheck() in db.ts
// When triggered, shows a blocking MUI Dialog warning the user.

import { useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';

import { useTranslation } from 'src/contexts';

// ── Helpers ───────────────────────────────────────────────────────────

function fmtMB(bytes: number): string {
  return `${Math.round(bytes / 1024 / 1024)} MB`;
}

// ── Types ─────────────────────────────────────────────────────────────

type DiskEvent = {
  level: 'low' | 'critical' | 'write-failed';
  freeBytes?: number;
};

// ── Component ─────────────────────────────────────────────────────────

export function DiskSpaceMonitor() {
  const { language } = useTranslation();
  const [event, setEvent] = useState<DiskEvent | null>(null);

  useEffect(() => {
    // ── Reactive: SQLite write failed with SQLITE_FULL ────────────────
    const onWriteFailed = () => setEvent({ level: 'write-failed' });
    window.addEventListener('db:disk-full', onWriteFailed);

    // ── Proactive: main process disk:warning IPC push ─────────────────
    const onDiskWarning = (data: { level: 'low' | 'critical'; freeBytes: number }) => {
      setEvent({ level: data.level, freeBytes: data.freeBytes });
    };
    window.database?.onDiskWarning(onDiskWarning);

    return () => {
      window.removeEventListener('db:disk-full', onWriteFailed);
      window.database?.offDiskWarning(onDiskWarning);
    };
  }, []);

  if (!event) return null;

  // ── Strings per language ──────────────────────────────────────────
  const strings = {
    fr: {
      criticalTitle: '⚠️ Disque plein — Données non sauvegardées',
      criticalBody:
        "Votre disque dur est plein. La dernière sauvegarde a échoué — les données ne sont PAS enregistrées. Libérez de l'espace disque immédiatement.",
      lowTitle: '⚠️ Espace disque insuffisant',
      lowBody: (mb: string) =>
        `Il ne reste que ${mb} d'espace libre sur votre disque. Sauvegardez vos données et libérez de l'espace bientôt pour éviter toute perte.`,
      writeTitle: '⚠️ Sauvegarde échouée — Disque plein',
      writeBody:
        "L'enregistrement a échoué car votre disque est plein. Libérez de l'espace disque immédiatement. Les données affichées ne sont pas persistées.",
      close: 'Compris',
    },
    ar: {
      criticalTitle: '⚠️ القرص ممتلئ — لم يتم حفظ البيانات',
      criticalBody:
        'القرص الصلب ممتلئ. فشل آخر حفظ — البيانات غير مسجلة. قم بتحرير مساحة على الفور.',
      lowTitle: '⚠️ مساحة القرص منخفضة',
      lowBody: (mb: string) =>
        `لم يتبق سوى ${mb} من المساحة الحرة على قرصك. قم بنسخ احتياطي لبياناتك وتحرير مساحة قريبًا.`,
      writeTitle: '⚠️ فشل الحفظ — القرص ممتلئ',
      writeBody:
        'فشل الحفظ لأن القرص ممتلئ. قم بتحرير مساحة فورًا. البيانات المعروضة غير محفوظة.',
      close: 'حسنًا',
    },
    en: {
      criticalTitle: '⚠️ Disk Full — Data Not Saved',
      criticalBody:
        'Your disk is full. The last save failed — data is NOT persisted. Free up disk space immediately.',
      lowTitle: '⚠️ Low Disk Space',
      lowBody: (mb: string) =>
        `Only ${mb} free space remaining on your disk. Back up your data and free up space soon to avoid data loss.`,
      writeTitle: '⚠️ Save Failed — Disk Full',
      writeBody:
        'A save operation failed because your disk is full. Free up disk space immediately. The data shown on screen is NOT saved to the database.',
      close: 'Understood',
    },
  };

  const s = strings[language as keyof typeof strings] ?? strings.fr;
  const freeMB = event.freeBytes ? fmtMB(event.freeBytes) : '';

  let title: string;
  let body: string;
  let severity: 'error' | 'warning';

  if (event.level === 'write-failed') {
    title = s.writeTitle;
    body = s.writeBody;
    severity = 'error';
  } else if (event.level === 'critical') {
    title = s.criticalTitle;
    body = s.criticalBody;
    severity = 'error';
  } else {
    title = s.lowTitle;
    body = s.lowBody(freeMB);
    severity = 'warning';
  }

  return (
    <Dialog
      open
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          border: `2px solid`,
          borderColor: severity === 'error' ? 'error.main' : 'warning.main',
          borderRadius: 2,
          maxWidth: 480,
        },
      }}
    >
      <DialogTitle
        sx={{
          color: severity === 'error' ? 'error.main' : 'warning.main',
          fontWeight: 700,
          fontSize: '1.1rem',
        }}
      >
        {title}
      </DialogTitle>

      <DialogContent>
        <DialogContentText sx={{ color: 'text.primary', lineHeight: 1.7 }}>
          {body}
        </DialogContentText>
        {event.freeBytes !== undefined && event.level !== 'write-failed' && (
          <Box
            sx={{
              mt: 2,
              px: 2,
              py: 1,
              borderRadius: 1,
              bgcolor: severity === 'error' ? 'error.lighter' : 'warning.lighter',
              typography: 'caption',
              color: severity === 'error' ? 'error.dark' : 'warning.dark',
            }}
          >
            {language === 'ar' ? `مساحة حرة: ${freeMB}` : language === 'fr' ? `Espace libre : ${freeMB}` : `Free space: ${freeMB}`}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2.5, pb: 2 }}>
        <Button
          variant="contained"
          color={severity}
          onClick={() => setEvent(null)}
        >
          {s.close}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
