// ── French ────────────────────────────────────────────────────────────────────
const onesFr = [
  '', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize',
  'dix-sept', 'dix-huit', 'dix-neuf',
];

function lt100Fr(n: number): string {
  if (n < 20) return onesFr[n];
  const d = Math.floor(n / 10);
  const u = n % 10;
  if (d === 7) return u === 1 ? 'soixante-et-onze' : `soixante-${onesFr[10 + u]}`;
  if (d === 8) return u === 0 ? 'quatre-vingts' : `quatre-vingt-${onesFr[u]}`;
  if (d === 9) return `quatre-vingt-${onesFr[10 + u]}`;
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'][d];
  if (u === 0) return tens;
  if (u === 1) return `${tens}-et-un`;
  return `${tens}-${onesFr[u]}`;
}

function lt1000Fr(n: number): string {
  if (n < 100) return lt100Fr(n);
  const h = Math.floor(n / 100);
  const r = n % 100;
  const cent = h === 1 ? 'cent' : `${onesFr[h]} cent`;
  if (r === 0) return h === 1 ? 'cent' : `${onesFr[h]} cents`;
  return `${cent} ${lt100Fr(r)}`;
}

function toWordsFr(n: number): string {
  if (n === 0) return 'zéro';
  let r = '';
  if (n >= 1000000) {
    const m = Math.floor(n / 1000000);
    r += m === 1 ? 'un million' : `${lt1000Fr(m)} millions`;
    n %= 1000000;
    if (n > 0) r += ' ';
  }
  if (n >= 1000) {
    const th = Math.floor(n / 1000);
    r += th === 1 ? 'mille' : `${lt1000Fr(th)} mille`;
    n %= 1000;
    if (n > 0) r += ' ';
  }
  if (n > 0) r += lt1000Fr(n);
  return r;
}

// ── Arabic ────────────────────────────────────────────────────────────────────
const onesAr = [
  '', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة',
  'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر',
  'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر',
];
const tensAr = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];

function lt100Ar(n: number): string {
  if (n < 20) return onesAr[n];
  const d = Math.floor(n / 10);
  const u = n % 10;
  if (u === 0) return tensAr[d];
  return `${onesAr[u]} و${tensAr[d]}`;
}

function lt1000Ar(n: number): string {
  if (n < 100) return lt100Ar(n);
  const h = Math.floor(n / 100);
  const r = n % 100;
  const cent = h === 1 ? 'مئة' : h === 2 ? 'مئتان' : `${onesAr[h]} مئة`;
  if (r === 0) return cent;
  return `${cent} و${lt100Ar(r)}`;
}

function toWordsAr(n: number): string {
  if (n === 0) return 'صفر';
  let r = '';
  if (n >= 1000000) {
    const m = Math.floor(n / 1000000);
    r += m === 1 ? 'مليون' : `${lt1000Ar(m)} مليون`;
    n %= 1000000;
    if (n > 0) r += ' و';
  }
  if (n >= 1000) {
    const th = Math.floor(n / 1000);
    r += th === 1 ? 'ألف' : th === 2 ? 'ألفان' : `${lt1000Ar(th)} ألف`;
    n %= 1000;
    if (n > 0) r += ' و';
  }
  if (n > 0) r += lt1000Ar(n);
  return r;
}

// ── English ───────────────────────────────────────────────────────────────────
const onesEn = [
  '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen',
];
const tensEn = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function lt100En(n: number): string {
  if (n < 20) return onesEn[n];
  const d = Math.floor(n / 10);
  const u = n % 10;
  return tensEn[d] + (u > 0 ? `-${onesEn[u]}` : '');
}

function lt1000En(n: number): string {
  if (n < 100) return lt100En(n);
  const h = Math.floor(n / 100);
  const r = n % 100;
  return `${onesEn[h]} hundred${r > 0 ? ' ' + lt100En(r) : ''}`;
}

function toWordsEn(n: number): string {
  if (n === 0) return 'zero';
  let r = '';
  if (n >= 1000000) {
    const m = Math.floor(n / 1000000);
    r += `${lt1000En(m)} million${m > 1 ? 's' : ''}`;
    n %= 1000000;
    if (n > 0) r += ' ';
  }
  if (n >= 1000) {
    const th = Math.floor(n / 1000);
    r += `${lt1000En(th)} thousand`;
    n %= 1000;
    if (n > 0) r += ' ';
  }
  if (n > 0) r += lt1000En(n);
  return r;
}

// ── Public API ────────────────────────────────────────────────────────────────
export function numberToWords(amount: number, lang: string): string {
  const n = Math.floor(amount);
  const centimes = Math.round((amount - n) * 100);

  let words: string;
  if (lang === 'ar') {
    words = `${toWordsAr(n)} دينار`;
    if (centimes > 0) words += ` و${lt100Ar(centimes)} سنتيم`;
  } else if (lang === 'en') {
    words = `${toWordsEn(n)} ${n === 1 ? 'Dinar' : 'Dinars'}`;
    if (centimes > 0) words += ` and ${lt100En(centimes)} centimes`;
  } else {
    words = `${toWordsFr(n)} ${n > 1 ? 'Dinars' : 'Dinar'}`;
    if (centimes > 0) words += ` et ${lt100Fr(centimes)} centimes`;
  }

  return words.charAt(0).toUpperCase() + words.slice(1);
}
