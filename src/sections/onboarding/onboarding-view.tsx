import { useState, useCallback, useRef } from 'react';

import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { useI18n, useBusiness, useSettings } from 'src/contexts';
import type { Language } from 'src/contexts';
import { Iconify } from 'src/components/iconify';
import { ADMIN_PASSWORD_KEY } from 'src/sections/settings/settings-account';

// ──────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────

type OnboardingData = {
  // Page 2 — Account
  displayName: string;
  password: string;
  confirmPassword: string;
  // Page 3 — Business
  businessName: string;
  phone: string;
  address: string;
  nif: string;
  nis: string;
  rc: string;
  ai: string;
  logo: string;
  // Page 4 — TVA
  tvaRate: number | null; // null = not answered
  // Page 5 — Preferences
  colorMode: 'light' | 'dark';
  defaultUnits: string[];
  lowStockThreshold: number;
  categories: string[];
  expenseCategoriesEnabled: boolean;
  expenseCategories: string[];
};

const TOTAL_STEPS = 6;

const ONBOARDING_KEY = 'onboarding_complete';

export function isOnboardingComplete(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
}

// ──────────────────────────────────────────────────────────────────────
// Mini i18n for the onboarding (before contexts are ready, uses same keys)
// ──────────────────────────────────────────────────────────────────────

const ob: Record<Language, Record<string, string>> = {
  en: {
    tagline: 'Manage your stock and invoices easily',
    getStarted: 'Get Started',
    back: 'Back',
    next: 'Next',
    skip: 'You can change this later in Settings',
    // Page 2
    accountSetup: 'Account Setup',
    accountSubtitle: 'Create your admin credentials',
    fullName: 'Full Name',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    minChars: 'Minimum 6 characters',
    passwordMismatch: 'Passwords do not match',
    passwordTooShort: 'Password must be at least 6 characters',
    nameRequired: 'Full name is required',
    // Page 3
    businessSetup: 'Business Setup',
    businessSubtitle: 'Tell us about your business',
    businessName: 'Business Name',
    phone: 'Phone',
    address: 'Address',
    uploadLogo: 'Upload Logo',
    changeLogo: 'Change Logo',
    // Page 4
    tvaTitle: 'TVA Configuration',
    tvaSubtitle: 'This setting affects how invoices are generated',
    tvaNo: 'No TVA',
    tvaNoDesc: 'Invoices will not include TVA',
    tvaYes: 'Standard (19%)',
    tvaYesDesc: 'TVA at 19% will appear on all invoices',
    tvaCustom: 'Custom rate',
    tvaCustomDesc: 'Enter your applicable TVA rate',
    tvaCustomLabel: 'TVA Rate (%)',
    // Page 5
    prefsTitle: 'Preferences',
    prefsSubtitle: 'Customize the app to your needs',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    defaultUnit: 'Default Unit',
    lowStockThreshold: 'Low Stock Threshold',
    categories: 'Product Categories',
    addCategory: 'Add category',
    expCatTitle: 'Expense Categories',
    expCatDesc: 'Define categories for your expense tracking',
    addExpCategory: 'Add expense category',
    // Page 6
    readyTitle: "Your account is ready!",
    readySubtitle: "Everything is set up. Let's get started.",
    tip1: 'Add your products in Inventory',
    tip2: 'Create your first invoice',
    tip3: 'Track your clients and payments',
    enterApp: 'Enter the App →',
    stepOf: 'Step',
    of: 'of',
  },
  fr: {
    tagline: 'Gérez votre stock et vos factures facilement',
    getStarted: 'Commencer',
    back: 'Retour',
    next: 'Suivant',
    skip: 'Vous pouvez modifier cela plus tard dans Paramètres',
    accountSetup: 'Création du compte',
    accountSubtitle: 'Créez vos identifiants administrateur',
    fullName: 'Nom complet',
    password: 'Mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    minChars: 'Minimum 6 caractères',
    passwordMismatch: 'Les mots de passe ne correspondent pas',
    passwordTooShort: 'Le mot de passe doit comporter au moins 6 caractères',
    nameRequired: 'Le nom complet est requis',
    businessSetup: 'Configuration de l\'entreprise',
    businessSubtitle: 'Dites-nous qui vous êtes',
    businessName: 'Nom de l\'entreprise',
    phone: 'Téléphone',
    address: 'Adresse',
    uploadLogo: 'Télécharger un logo',
    changeLogo: 'Changer le logo',
    tvaTitle: 'Configuration TVA',
    tvaSubtitle: 'Ce paramètre affecte la génération des factures',
    tvaNo: 'Sans TVA',
    tvaNoDesc: 'Les factures n\'incluront pas la TVA',
    tvaYes: 'Standard (19 %)',
    tvaYesDesc: 'La TVA à 19 % apparaîtra sur toutes les factures',
    tvaCustom: 'Taux personnalisé',
    tvaCustomDesc: 'Saisissez votre taux de TVA applicable',
    tvaCustomLabel: 'Taux TVA (%)',
    prefsTitle: 'Préférences',
    prefsSubtitle: 'Personnalisez l\'application selon vos besoins',
    theme: 'Thème',
    light: 'Clair',
    dark: 'Sombre',
    defaultUnit: 'Unité par défaut',
    lowStockThreshold: 'Seuil de stock faible',
    categories: 'Catégories de produits',
    addCategory: 'Ajouter une catégorie',
    expCatTitle: 'Catégories de dépenses',
    expCatDesc: 'Définissez les catégories pour le suivi de vos dépenses',
    addExpCategory: 'Ajouter une catégorie de dépense',
    readyTitle: 'Votre compte est prêt !',
    readySubtitle: 'Tout est configuré. Commençons.',
    tip1: 'Ajoutez vos produits dans Inventaire',
    tip2: 'Créez votre première facture',
    tip3: 'Suivez vos clients et paiements',
    enterApp: 'Accéder à l\'application →',
    stepOf: 'Étape',
    of: 'sur',
  },
  ar: {
    tagline: 'أدر مخزونك وفواتيرك بسهولة',
    getStarted: 'ابدأ',
    back: 'رجوع',
    next: 'التالي',
    skip: 'يمكنك تغيير هذا لاحقاً في الإعدادات',
    accountSetup: 'إعداد الحساب',
    accountSubtitle: 'أنشئ بيانات اعتماد المشرف',
    fullName: 'الاسم الكامل',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    minChars: '٦ أحرف على الأقل',
    passwordMismatch: 'كلمتا المرور غير متطابقتين',
    passwordTooShort: 'يجب أن تتكون كلمة المرور من ٦ أحرف على الأقل',
    nameRequired: 'الاسم الكامل مطلوب',
    businessSetup: 'إعداد المؤسسة',
    businessSubtitle: 'أخبرنا عن مؤسستك',
    businessName: 'اسم المؤسسة',
    phone: 'الهاتف',
    address: 'العنوان',
    uploadLogo: 'رفع الشعار',
    changeLogo: 'تغيير الشعار',
    tvaTitle: 'إعداد الضريبة',
    tvaSubtitle: 'يؤثر هذا الإعداد على طريقة إنشاء الفواتير',
    tvaNo: 'بدون ضريبة',
    tvaNoDesc: 'لن تتضمن الفواتير الضريبة',
    tvaYes: 'قياسي (19%)',
    tvaYesDesc: 'ستظهر الضريبة بنسبة 19% على جميع الفواتير',
    tvaCustom: 'معدل مخصص',
    tvaCustomDesc: 'أدخل معدل الضريبة المطبق',
    tvaCustomLabel: 'معدل TVA (%)',
    prefsTitle: 'التفضيلات',
    prefsSubtitle: 'خصّص التطبيق وفق احتياجاتك',
    theme: 'المظهر',
    light: 'فاتح',
    dark: 'داكن',
    defaultUnit: 'الوحدة الافتراضية',
    lowStockThreshold: 'حد تنبيه المخزون المنخفض',
    categories: 'فئات المنتجات',
    addCategory: 'إضافة فئة',
    expCatTitle: 'فئات المصاريف',
    expCatDesc: 'حدد فئات لتتبع مصاريفك',
    addExpCategory: 'إضافة فئة مصروف',
    readyTitle: 'حسابك جاهز!',
    readySubtitle: 'تم الإعداد بالكامل. لنبدأ.',
    tip1: 'أضف منتجاتك في المخزون',
    tip2: 'أنشئ أول فاتورة',
    tip3: 'تابع عملاءك والمدفوعات',
    enterApp: '← الدخول إلى التطبيق',
    stepOf: 'خطوة',
    of: 'من',
  },
};

const DEFAULT_CATEGORIES = {
  en: ['Electronics', 'Food & Beverage', 'Hygiene', 'Clothing', 'Other'],
  fr: ['Alimentaire', 'Électronique', 'Hygiène', 'Boissons', 'Autre'],
  ar: ['إلكترونيات', 'مواد غذائية', 'نظافة', 'مشروبات', 'أخرى'],
};

const CATEGORY_COLORS = ['#1976D2', '#9C27B0', '#ED6C02', '#2E7D32', '#0288D1', '#FF6B6B', '#4ECDC4', '#757575'];

const DEFAULT_EXPENSE_CATS = {
  en: ['Rent', 'Utilities', 'Transport', 'Salaries', 'Maintenance', 'Other'],
  fr: ['Loyer', 'Charges', 'Transport', 'Salaires', 'Maintenance', 'Autre'],
  ar: ['إيجار', 'مرافق', 'نقل', 'رواتب', 'صيانة', 'أخرى'],
};

const UNIT_LABELS: Record<string, Record<Language, string>> = {
  pcs: { en: 'Pieces (pcs)', fr: 'Pièces', ar: 'قطع' },
  kg: { en: 'Kilogram (kg)', fr: 'Kilogramme (kg)', ar: 'كيلوغرام' },
  g: { en: 'Gram (g)', fr: 'Gramme (g)', ar: 'غرام' },
  mg: { en: 'Milligram (mg)', fr: 'Milligramme (mg)', ar: 'ملغرام' },
  ton: { en: 'Tonne', fr: 'Tonne', ar: 'طن' },
  quintar: { en: 'Quintal', fr: 'Quintal', ar: 'قنطار' },
  l: { en: 'Litre (L)', fr: 'Litre (L)', ar: 'لتر' },
  ml: { en: 'Millilitre (ml)', fr: 'Millilitre (ml)', ar: 'مليلتر' },
  m: { en: 'Metre (m)', fr: 'Mètre (m)', ar: 'متر' },
  cm: { en: 'Centimetre (cm)', fr: 'Centimètre (cm)', ar: 'سنتيمتر' },
  mm: { en: 'Millimetre (mm)', fr: 'Millimètre (mm)', ar: 'مليمتر' },
};

// ──────────────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────────────

type Props = {
  onComplete: () => void;
};

export function OnboardingView({ onComplete }: Props) {
  const theme = useTheme();
  const { language, setLanguage } = useI18n();
  const { updateBusinessInfo } = useBusiness();
  const { updateInvoiceSettings, updatePreferences, addProductCategory, productCategories, deleteProductCategory, addExpenseCategory, deleteExpenseCategory, expenseCategories: existingExpCategories } = useSettings();

  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const i = (key: string) => ob[language]?.[key] ?? ob.fr[key] ?? key;

  const [step, setStep] = useState(1);
  const [accountErrors, setAccountErrors] = useState<Record<string, string>>({});

  const [data, setData] = useState<OnboardingData>({
    displayName: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    phone: '',
    address: '',
    nif: '',
    nis: '',
    rc: '',
    ai: '',
    logo: '',
    tvaRate: null,
    colorMode: 'light',
    defaultUnits: ['pcs'],
    lowStockThreshold: 10,
    categories: DEFAULT_CATEGORIES[language],
    expenseCategoriesEnabled: false,
    expenseCategories: DEFAULT_EXPENSE_CATS[language],
  });

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [newExpCat, setNewExpCat] = useState('');
  const [tvaMode, setTvaMode] = useState<'standard' | 'custom' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // When language changes, refresh default categories if user hasn't edited them
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setData((prev) => ({
      ...prev,
      categories: DEFAULT_CATEGORIES[lang],
      expenseCategories: DEFAULT_EXPENSE_CATS[lang],
    }));
  };

  const set = (field: keyof OnboardingData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const validateAccount = (): boolean => {
    const errors: Record<string, string> = {};
    if (!data.displayName.trim()) errors.displayName = i('nameRequired');
    if (data.password.length < 6) errors.password = i('passwordTooShort');
    if (data.password !== data.confirmPassword) errors.confirmPassword = i('passwordMismatch');
    setAccountErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (step === 2 && !validateAccount()) return;
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setData((prev) => ({ ...prev, logo: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleAddCategory = () => {
    if (!newCat.trim()) return;
    setData((prev) => ({ ...prev, categories: [...prev.categories, newCat.trim()] }));
    setNewCat('');
  };

  const handleRemoveCategory = (idx: number) => {
    setData((prev) => ({ ...prev, categories: prev.categories.filter((_, i) => i !== idx) }));
  };

  const handleAddExpenseCategory = () => {
    if (!newExpCat.trim()) return;
    setData((prev) => ({ ...prev, expenseCategories: [...prev.expenseCategories, newExpCat.trim()] }));
    setNewExpCat('');
  };

  const handleRemoveExpenseCategory = (idx: number) => {
    setData((prev) => ({ ...prev, expenseCategories: prev.expenseCategories.filter((_, i) => i !== idx) }));
  };

  const handleComplete = () => {
    // 1. Save admin credentials
    localStorage.setItem('user_profile', JSON.stringify({ displayName: data.displayName }));
    localStorage.setItem(ADMIN_PASSWORD_KEY, data.password);

    // 2. Save business info
    updateBusinessInfo({
      businessName: data.businessName,
      phone: data.phone,
      address: data.address,
      nif: data.nif,
      nis: data.nis,
      rc: data.rc,
      ai: data.ai,
      logo: data.logo || undefined,
    });

    // 3. TVA setting
    updateInvoiceSettings({ tvaRate: data.tvaRate ?? 0 });

    // 4. Preferences
    updatePreferences({
      colorMode: data.colorMode,
      lowStockThreshold: data.lowStockThreshold,
      enabledUnits: data.defaultUnits.length > 0 ? (data.defaultUnits as any) : undefined,
    });

    // 5. Replace product categories
    // Remove existing default categories
    const existingIds = productCategories.map((c) => c.id);
    existingIds.forEach((id) => deleteProductCategory(id));
    // Add new categories
    data.categories.forEach((label, idx) => {
      addProductCategory({ label, color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] });
    });

    // 6. Expense categories (if enabled)
    if (data.expenseCategoriesEnabled) {
      existingExpCategories.map((c) => c.id).forEach((id) => deleteExpenseCategory(id));
      data.expenseCategories.forEach((label, idx) => {
        addExpenseCategory({ label, color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] });
      });
    }

    // 7. Mark onboarding complete
    localStorage.setItem(ONBOARDING_KEY, 'true');

    onComplete();
  };

  // ────────── Layout shell ──────────

  const isRTL = dir === 'rtl';

  const shell = (content: React.ReactNode, skippable = false, skipAction?: () => void) => (
    <Box
      dir={dir}
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
      {/* Progress bar */}
      <Box sx={{ width: '100%', maxWidth: 560, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
          <Typography variant="caption" color="text.secondary">
            {i('stepOf')} {step} {i('of')} {TOTAL_STEPS}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {Math.round((step / TOTAL_STEPS) * 100)}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={(step / TOTAL_STEPS) * 100}
          sx={{
            height: 6,
            borderRadius: 99,
            bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
            '& .MuiLinearProgress-bar': { borderRadius: 99 },
          }}
        />
      </Box>

      {/* Card */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 560,
          bgcolor: 'background.paper',
          backgroundImage: (t) => `linear-gradient(145deg, ${alpha(t.palette.primary.main, 0.06)} 0%, transparent 50%)`,
          borderRadius: 3,
          boxShadow: (t) => `inset 0 1px 0 0 rgba(255,255,255,0.9), 0 4px 6px -2px ${alpha(t.palette.grey[500], 0.12)}, 0 12px 32px -4px ${alpha(t.palette.grey[500], 0.22)}`,
          border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.22)}`,
          overflow: 'hidden',
        }}
      >
        {content}
      </Box>

      {/* Skip link */}
      {skippable && (
        <Typography
          variant="caption"
          sx={{ mt: 2, cursor: 'pointer', textDecoration: 'underline', color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
          onClick={skipAction ?? handleNext}
        >
          {i('skip')}
        </Typography>
      )}
    </Box>
  );

  const navRow = (onNextLabel?: string, hideBack?: boolean, onNextFn?: () => void) => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: 3,
        pb: 3,
        flexDirection: isRTL ? 'row-reverse' : 'row',
      }}
    >
      {!hideBack ? (
        <Button
          variant="text"
          color="inherit"
          startIcon={<Iconify icon={isRTL ? 'eva:arrow-ios-forward-fill' : 'eva:arrow-ios-back-fill'} width={18} />}
          onClick={handleBack}
          sx={{ color: 'text.secondary' }}
        >
          {i('back')}
        </Button>
      ) : (
        <Box />
      )}
      <Button variant="contained" onClick={onNextFn ?? handleNext} sx={{ minWidth: 120 }}>
        {onNextLabel ?? i('next')}
      </Button>
    </Box>
  );

  // ──────────────────────────────────────────────────────────────────────
  // PAGE 1 — Welcome
  // ──────────────────────────────────────────────────────────────────────
  if (step === 1) {
    return shell(
      <Box sx={{ textAlign: 'center', px: 4, pt: 5, pb: 4 }}>
        {/* Logo */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
          <img
            src={theme.palette.mode === 'dark' ? '/assets/stockflow-logoF.png' : '/assets/stockflow-dark.png'}
            alt="Stockflow"
            style={{ height: 56, objectFit: 'contain' }}
          />
        </Box>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 5, maxWidth: 360, mx: 'auto' }}>
          {i('tagline')}
        </Typography>

        {/* Language selector */}
        <Typography variant="overline" color="text.disabled" sx={{ mb: 2, display: 'block', letterSpacing: 1.2 }}>
          {language === 'ar' ? 'اختر لغتك' : language === 'fr' ? 'Choisissez votre langue' : 'Choose your language'}
        </Typography>

        <Box dir="ltr" sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, mb: 5, justifyContent: 'center' }}>
          {(['fr', 'en', 'ar'] as Language[]).map((lang) => {
            const selected = language === lang;
            const labels = { fr: 'Français', en: 'English', ar: 'العربية' };
            return (
              <Box
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 2,
                  borderRadius: 2,
                  border: (t) => `2px solid ${selected ? t.palette.primary.main : t.vars.palette.divider}`,
                  bgcolor: selected ? (t) => alpha(t.palette.primary.main, 0.08) : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 160ms',
                  '&:hover': {
                    borderColor: 'primary.light',
                    bgcolor: (t) => alpha(t.palette.primary.main, 0.05),
                  },
                }}
              >
                <Typography variant="subtitle2" fontWeight={selected ? 700 : 500} sx={{ textAlign: 'center', width: '100%' }}>
                  {labels[lang]}
                </Typography>
              </Box>
            );
          })}
        </Box>

        <Button
          variant="contained"
          size="large"
          onClick={handleNext}
          fullWidth
          sx={{ borderRadius: 2, py: 1.5, fontSize: 16, fontWeight: 700 }}
        >
          {i('getStarted')}
        </Button>
      </Box>
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // PAGE 2 — Account Setup
  // ──────────────────────────────────────────────────────────────────────
  if (step === 2) {
    return shell(
      <Box>
        <Box sx={{ px: 3, pt: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: (t) => alpha(t.palette.primary.main, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main' }}>
              <Iconify icon="solar:user-bold-duotone" width={20} />
            </Box>
            <Typography variant="h6">{i('accountSetup')}</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">{i('accountSubtitle')}</Typography>
        </Box>

        <Divider />

        <Box sx={{ px: 3, py: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label={i('fullName')}
            value={data.displayName}
            onChange={set('displayName')}
            error={!!accountErrors.displayName}
            helperText={accountErrors.displayName}
            fullWidth
            autoFocus
          />

          <TextField
            label={i('password')}
            type={showPass ? 'text' : 'password'}
            value={data.password}
            onChange={set('password')}
            error={!!accountErrors.password}
            helperText={accountErrors.password ?? i('minChars')}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPass((v) => !v)} edge="end" size="small">
                    <Iconify icon={showPass ? 'solar:eye-bold' : 'solar:eye-closed-bold'} width={18} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label={i('confirmPassword')}
            type={showConfirm ? 'text' : 'password'}
            value={data.confirmPassword}
            onChange={set('confirmPassword')}
            error={!!accountErrors.confirmPassword}
            helperText={accountErrors.confirmPassword}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowConfirm((v) => !v)} edge="end" size="small">
                    <Iconify icon={showConfirm ? 'solar:eye-bold' : 'solar:eye-closed-bold'} width={18} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {navRow(undefined, false)}
      </Box>
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // PAGE 3 — Business Setup
  // ──────────────────────────────────────────────────────────────────────
  if (step === 3) {
    return shell(
      <Box>
        <Box sx={{ px: 3, pt: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: (t) => alpha(t.palette.warning.main, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'warning.main' }}>
              <Iconify icon="solar:buildings-bold-duotone" width={20} />
            </Box>
            <Typography variant="h6">{i('businessSetup')}</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">{i('businessSubtitle')}</Typography>
        </Box>

        <Divider />

        <Box sx={{ px: 3, py: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Logo upload */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              onClick={() => fileInputRef.current?.click()}
              sx={{
                width: 72,
                height: 72,
                borderRadius: 2,
                border: (t) => `2px dashed ${t.vars.palette.divider}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                overflow: 'hidden',
                flexShrink: 0,
                '&:hover': { borderColor: 'primary.main', bgcolor: (t) => alpha(t.palette.primary.main, 0.04) },
                transition: 'all 150ms',
              }}
            >
              {data.logo ? (
                <img src={data.logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <>
                  <Iconify icon="solar:camera-add-bold" width={22} sx={{ color: 'text.disabled' }} />
                  <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, fontSize: 10 }}>Logo</Typography>
                </>
              )}
            </Box>
            <Box>
              <Button size="small" variant="outlined" onClick={() => fileInputRef.current?.click()}>
                {data.logo ? i('changeLogo') : i('uploadLogo')}
              </Button>
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                PNG, JPG
              </Typography>
            </Box>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
          </Box>

          <TextField label={i('businessName')} value={data.businessName} onChange={set('businessName')} fullWidth />
          <TextField label={i('phone')} value={data.phone} onChange={set('phone')} fullWidth />
          <TextField label={i('address')} value={data.address} onChange={set('address')} fullWidth multiline rows={2} />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <TextField label="NIF" value={data.nif} onChange={set('nif')} size="small" />
            <TextField label="NIS" value={data.nis} onChange={set('nis')} size="small" />
            <TextField label="RC" value={data.rc} onChange={set('rc')} size="small" />
            <TextField label="AI" value={data.ai} onChange={set('ai')} size="small" />
          </Box>
        </Box>

        {navRow()}
      </Box>,
      true
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // PAGE 4 — TVA
  // ──────────────────────────────────────────────────────────────────────
  if (step === 4) {
    return shell(
      <Box>
        <Box sx={{ px: 3, pt: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: (t) => alpha(t.palette.info.main, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'info.main' }}>
              <Iconify icon="solar:receipt-bold-duotone" width={20} />
            </Box>
            <Typography variant="h6">{i('tvaTitle')}</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">{i('tvaSubtitle')}</Typography>
        </Box>

        <Divider />

        <Box sx={{ px: 3, py: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {(['standard', 'custom'] as const).map((key) => {
            const selected = tvaMode === key;
            const color = key === 'standard' ? theme.palette.success.main : theme.palette.warning.main;
            const icon = key === 'standard' ? 'solar:receipt-bold-duotone' : 'solar:pen-new-square-bold-duotone';
            const title = key === 'standard' ? i('tvaYes') : i('tvaCustom');
            const desc = key === 'standard' ? i('tvaYesDesc') : i('tvaCustomDesc');
            return (
              <Box
                key={key}
                onClick={() => {
                  setTvaMode(key);
                  if (key === 'standard') setData((prev) => ({ ...prev, tvaRate: 19 }));
                  else setData((prev) => ({ ...prev, tvaRate: prev.tvaRate ?? 19 }));
                }}
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  border: `2px solid ${selected ? color : 'transparent'}`,
                  bgcolor: selected ? alpha(color, 0.07) : (t) => alpha(t.palette.grey[500], 0.06),
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  transition: 'all 180ms',
                  '&:hover': { borderColor: color, bgcolor: alpha(color, 0.05) },
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: selected ? alpha(color, 0.15) : (t) => alpha(t.palette.grey[500], 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 180ms',
                  }}
                >
                  <Iconify icon={icon} width={22} sx={{ color: selected ? color : 'text.disabled' }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" fontWeight={selected ? 700 : 500}>{title}</Typography>
                  <Typography variant="caption" color="text.secondary">{desc}</Typography>
                </Box>
                {selected && <Iconify icon="eva:checkmark-circle-2-fill" width={20} sx={{ color, flexShrink: 0 }} />}
              </Box>
            );
          })}

          {/* Custom rate input — shown when custom is selected */}
          {tvaMode === 'custom' && (
            <TextField
              label={i('tvaCustomLabel')}
              type="number"
              value={data.tvaRate ?? ''}
              onChange={(e) => {
                const v = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
                setData((prev) => ({ ...prev, tvaRate: v }));
              }}
              fullWidth
              size="small"
              autoFocus
              InputProps={{ inputProps: { min: 0, max: 100, step: 0.1 } }}
              sx={{ mt: 0.5 }}
            />
          )}
        </Box>

        {navRow()}
      </Box>,
      true,
      () => { setTvaMode('standard'); setData((prev) => ({ ...prev, tvaRate: 19 })); handleNext(); }
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // PAGE 5 — Preferences
  // ──────────────────────────────────────────────────────────────────────
  if (step === 5) {
    return shell(
      <Box>
        <Box sx={{ px: 3, pt: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: (t) => alpha(t.palette.success.main, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'success.main' }}>
              <Iconify icon="solar:settings-bold-duotone" width={20} />
            </Box>
            <Typography variant="h6">{i('prefsTitle')}</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">{i('prefsSubtitle')}</Typography>
        </Box>

        <Divider />

        <Box sx={{ px: 3, py: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Theme */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>{i('theme')}</Typography>
            <ToggleButtonGroup
              exclusive
              value={data.colorMode}
              onChange={(_, v) => { if (v) { setData((prev) => ({ ...prev, colorMode: v })); updatePreferences({ colorMode: v }); } }}
              fullWidth
              size="small"
            >
              <ToggleButton value="light" sx={{ gap: 1, fontWeight: 600, textTransform: 'none' }}>
                <Iconify icon="solar:sun-bold-duotone" width={18} />
                {i('light')}
              </ToggleButton>
              <ToggleButton value="dark" sx={{ gap: 1, fontWeight: 600, textTransform: 'none' }}>
                <Iconify icon="solar:moon-bold-duotone" width={18} />
                {i('dark')}
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Default unit */}
          <TextField
            select
            SelectProps={{
              multiple: true,
              renderValue: (selected) =>
                (selected as string[])
                  .map((v) => UNIT_LABELS[v]?.[language] ?? v)
                  .join(', '),
            }}
            label={i('defaultUnit')}
            value={data.defaultUnits}
            onChange={(e) => {
              const val = e.target.value;
              setData((prev) => ({ ...prev, defaultUnits: Array.isArray(val) ? val : [val] }));
            }}
            fullWidth
            size="small"
          >
            {Object.entries(UNIT_LABELS).map(([val, labels]) => (
              <MenuItem key={val} value={val}>
                <Checkbox checked={data.defaultUnits.includes(val)} size="small" sx={{ mr: 1, p: 0 }} />
                {labels[language] ?? labels.en}
              </MenuItem>
            ))}
          </TextField>

          {/* Low stock threshold */}
          <TextField
            label={i('lowStockThreshold')}
            type="number"
            value={data.lowStockThreshold}
            onChange={(e) => setData((prev) => ({ ...prev, lowStockThreshold: Math.max(1, parseInt(e.target.value, 10) || 1) }))}
            fullWidth
            size="small"
            InputProps={{ inputProps: { min: 1 } }}
          />

          {/* Categories */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>{i('categories')}</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
              {data.categories.map((cat, idx) => (
                <Chip
                  key={idx}
                  label={cat}
                  size="small"
                  onDelete={() => handleRemoveCategory(idx)}
                  sx={{ bgcolor: alpha(CATEGORY_COLORS[idx % CATEGORY_COLORS.length], 0.12), color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length], fontWeight: 600 }}
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                placeholder={i('addCategory')}
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }}
                sx={{ flex: 1 }}
              />
              <Button variant="outlined" size="small" onClick={handleAddCategory} sx={{ minWidth: 40, px: 1.5 }}>
                <Iconify icon="eva:plus-fill" width={18} />
              </Button>
            </Box>
          </Box>

          {/* Expense Categories */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle2">{i('expCatTitle')}</Typography>
                <Typography variant="caption" color="text.secondary">{i('expCatDesc')}</Typography>
              </Box>
              <Switch
                checked={data.expenseCategoriesEnabled}
                onChange={(e) => setData((prev) => ({ ...prev, expenseCategoriesEnabled: e.target.checked }))}
                size="small"
              />
            </Box>
            {data.expenseCategoriesEnabled && (
              <Box sx={{ mt: 1.5 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                  {data.expenseCategories.map((cat, idx) => (
                    <Chip
                      key={idx}
                      label={cat}
                      size="small"
                      onDelete={() => handleRemoveExpenseCategory(idx)}
                      sx={{ bgcolor: alpha(CATEGORY_COLORS[idx % CATEGORY_COLORS.length], 0.12), color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length], fontWeight: 600 }}
                    />
                  ))}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    size="small"
                    placeholder={i('addExpCategory')}
                    value={newExpCat}
                    onChange={(e) => setNewExpCat(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddExpenseCategory(); } }}
                    sx={{ flex: 1 }}
                  />
                  <Button variant="outlined" size="small" onClick={handleAddExpenseCategory} sx={{ minWidth: 40, px: 1.5 }}>
                    <Iconify icon="eva:plus-fill" width={18} />
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </Box>

        {navRow()}
      </Box>,
      true
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // PAGE 6 — Ready!
  // ──────────────────────────────────────────────────────────────────────
  if (step === 6) {
    const tips = [
      { icon: 'solar:box-bold-duotone', text: i('tip1'), color: theme.palette.primary.main },
      { icon: 'solar:bill-list-bold-duotone', text: i('tip2'), color: theme.palette.success.main },
      { icon: 'solar:users-group-rounded-bold-duotone', text: i('tip3'), color: theme.palette.warning.main },
    ];

    return shell(
      <Box>
        <Box sx={{ textAlign: 'center', px: 4, pt: 5, pb: 2 }}>
          {/* Animated checkmark */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: (t) => alpha(t.palette.success.main, 0.12),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
              animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
              '@keyframes popIn': {
                from: { transform: 'scale(0)', opacity: 0 },
                to: { transform: 'scale(1)', opacity: 1 },
              },
            }}
          >
            <Iconify icon="solar:check-circle-bold-duotone" width={44} sx={{ color: 'success.main' }} />
          </Box>

          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>{i('readyTitle')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>{i('readySubtitle')}</Typography>
        </Box>

        <Divider />

        <Box sx={{ px: 3, py: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {tips.map((tip, idx) => (
            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(tip.color, 0.12),
                  flexShrink: 0,
                }}
              >
                <Iconify icon={tip.icon} width={22} sx={{ color: tip.color }} />
              </Box>
              <Typography variant="body2">{tip.text}</Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ px: 3, pb: 3, pt: 1 }}>
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleComplete}
            sx={{ borderRadius: 2, py: 1.5, fontSize: 15, fontWeight: 700 }}
          >
            {i('enterApp')}
          </Button>
        </Box>
      </Box>
    );
  }

  return null;
}
