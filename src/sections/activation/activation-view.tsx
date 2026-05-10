import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

// ──────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────

const HARDWARE_ID_PLACEHOLDER = 'XXXX-XXXX-XXXX-XXXX';
const ACTIVATION_KEY = 'activation_complete';

const WHATSAPP_CONTACTS = [
  { label: 'Contacter Associé 1', url: 'https://wa.me/213552520878' },
  { label: 'Contacter Associé 2', url: 'https://wa.me/213660313500' },
] as const;

// ──────────────────────────────────────────────────────────────────────
// Public helper — used by the guard in app.tsx
// ──────────────────────────────────────────────────────────────────────

export function isActivationComplete(): boolean {
  return localStorage.getItem(ACTIVATION_KEY) === 'true';
}

// ──────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────

type Props = {
  onComplete: () => void;
};

export function ActivationView({ onComplete }: Props) {
  const theme = useTheme();
  const [activationCode, setActivationCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [hardwareId, setHardwareId] = useState(HARDWARE_ID_PLACEHOLDER);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── On mount: fetch Hardware ID + check if already activated ──
  useEffect(() => {
    const appShell = (window as any).appShell;
    if (!appShell) return;

    // Fetch the real Hardware ID
    if (appShell.getHardwareId) {
      appShell.getHardwareId()
        .then((id: string) => { if (id) setHardwareId(id); })
        .catch(() => {});
    }

    // Check if activation file already exists (e.g. localStorage was cleared
    // but the AppData file persists — same pattern as onboarding's DB check)
    if (appShell.checkActivation) {
      appShell.checkActivation()
        .then((result: { activated: boolean }) => {
          if (result?.activated) {
            localStorage.setItem(ACTIVATION_KEY, 'true');
            onComplete();
          }
        })
        .catch(() => {});
    }
  }, [onComplete]);

  // ── Copy Hardware ID to clipboard ──
  const handleCopy = () => {
    navigator.clipboard.writeText(hardwareId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Verify activation code via main process IPC ──
  const handleActivate = async () => {
    setError('');
    setLoading(true);

    try {
      const appShell = (window as any).appShell;
      if (!appShell?.verifyActivation) {
        setError('Activation non disponible (mode navigateur)');
        setLoading(false);
        return;
      }

      const result = await appShell.verifyActivation(hardwareId, activationCode);

      if (result?.success) {
        localStorage.setItem(ACTIVATION_KEY, 'true');
        onComplete();
      } else {
        setError('Code invalide');
      }
    } catch {
      setError('Erreur lors de la vérification');
    } finally {
      setLoading(false);
    }
  };

  // ── Open WhatsApp link ──
  const handleWhatsApp = (url: string) => {
    if (typeof window !== 'undefined' && (window as any).electron?.shell?.openExternal) {
      (window as any).electron.shell.openExternal(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2,
        py: 4,
      }}
    >
      {/* Card — same shell as onboarding */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 560,
          bgcolor: 'background.paper',
          backgroundImage: (t) =>
            `linear-gradient(145deg, ${alpha(t.palette.primary.main, 0.06)} 0%, transparent 50%)`,
          borderRadius: 3,
          boxShadow: (t) =>
            `inset 0 1px 0 0 rgba(255,255,255,0.9), 0 4px 6px -2px ${alpha(t.palette.grey[500], 0.12)}, 0 12px 32px -4px ${alpha(t.palette.grey[500], 0.22)}`,
          border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.22)}`,
          overflow: 'hidden',
        }}
      >
        {/* ── Header ── */}
        <Box sx={{ textAlign: 'center', px: 4, pt: 5, pb: 3 }}>
          {/* Logo */}
          <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'center' }}>
            <img
              src={
                theme.palette.mode === 'dark'
                  ? '/assets/stockflow-logoF.png'
                  : '/assets/stockflow-dark.png'
              }
              alt="Stockflow"
              style={{ height: 56, objectFit: 'contain' }}
            />
          </Box>

          {/* Lock icon badge */}
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: (t) => alpha(t.palette.warning.main, 0.12),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'warning.main',
              mx: 'auto',
              mb: 2,
            }}
          >
            <Iconify icon="solar:lock-keyhole-bold-duotone" width={28} />
          </Box>

          {/* Title */}
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            Activation requise
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 400, mx: 'auto', lineHeight: 1.6 }}
          >
            Contactez-nous sur WhatsApp avec votre Hardware ID pour recevoir votre code
            d&apos;activation
          </Typography>
        </Box>

        <Divider />

        {/* ── Body ── */}
        <Box sx={{ px: 3, py: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Hardware ID box */}
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 0.75, display: 'block', fontWeight: 600, letterSpacing: 0.5 }}
            >
              Hardware ID
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1.25,
                borderRadius: 1.5,
                border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.24)}`,
                bgcolor: (t) => alpha(t.palette.grey[500], 0.06),
              }}
            >
              <Iconify
                icon="solar:cpu-bold-duotone"
                width={18}
                sx={{ color: 'text.disabled', flexShrink: 0 }}
              />
              <Typography
                variant="body2"
                sx={{
                  flex: 1,
                  fontFamily: 'monospace',
                  fontSize: 14,
                  letterSpacing: 1.2,
                  color: 'text.primary',
                  userSelect: 'all',
                }}
              >
                {hardwareId}
              </Typography>
              <IconButton
                size="small"
                onClick={handleCopy}
                sx={{
                  color: copied ? 'success.main' : 'text.secondary',
                  transition: 'color 200ms',
                  '&:hover': { color: 'primary.main' },
                }}
                title={copied ? 'Copié !' : 'Copier le Hardware ID'}
              >
                <Iconify
                  icon={copied ? 'solar:check-circle-bold' : 'solar:copy-bold-duotone'}
                  width={18}
                />
              </IconButton>
            </Box>
            {copied && (
              <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block' }}>
                Hardware ID copié dans le presse-papiers !
              </Typography>
            )}
          </Box>

          {/* Activation code input */}
          <TextField
            label="Code d'activation"
            placeholder="XXXX-XXXX-XXXX-XXXX"
            value={activationCode}
            onChange={(e) => {
              setActivationCode(e.target.value);
              if (error) setError(''); // Clear error when user types
            }}
            error={!!error}
            helperText={error || undefined}
            fullWidth
            inputProps={{ style: { fontFamily: 'monospace', letterSpacing: 1.2 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="solar:key-bold-duotone" width={18} sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />

          {/* Activate button */}
          <Button
            variant="contained"
            size="large"
            fullWidth
            disabled={!activationCode.trim() || loading}
            onClick={handleActivate}
            sx={{ borderRadius: 2, py: 1.5, fontSize: 15, fontWeight: 700 }}
          >
            {loading ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              <>
                <Iconify icon="solar:shield-check-bold-duotone" width={20} sx={{ mr: 1 }} />
                Activer
              </>
            )}
          </Button>
        </Box>

        <Divider />

        {/* ── WhatsApp buttons ── */}
        <Box sx={{ px: 3, py: 2.5, display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
          {WHATSAPP_CONTACTS.map((contact) => (
            <Button
              key={contact.url}
              variant="outlined"
              fullWidth
              onClick={() => handleWhatsApp(contact.url)}
              startIcon={
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              }
              sx={{
                borderRadius: 2,
                py: 1.25,
                fontWeight: 600,
                fontSize: 13,
                borderColor: (t) => alpha('#25D366', 0.5),
                color: '#25D366',
                '&:hover': {
                  bgcolor: alpha('#25D366', 0.08),
                  borderColor: '#25D366',
                },
              }}
            >
              {contact.label}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Footer caption */}
      <Typography
        variant="caption"
        color="text.disabled"
        sx={{ mt: 2.5, textAlign: 'center' }}
      >
        Stockflow © {new Date().getFullYear()} — Licence requise pour utilisation
      </Typography>
    </Box>
  );
}
