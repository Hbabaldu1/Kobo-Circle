export function normalizeWhatsAppPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;

  const trimmed = phone.trim();
  if (!trimmed) return null;

  const compact = trimmed.replace(/[\s-]/g, '');
  const digits = compact.replace(/[^\d+]/g, '');

  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('0')) return `+234${digits.slice(1)}`;
  return `+${digits}`;
}

export function buildWhatsAppListingLink(phone: string | null | undefined, title: string): string | null {
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  if (!normalizedPhone) return null;

  const phoneForUrl = normalizedPhone.replace(/^\+/, '');
  const message = `Hi, I saw your listing '${title}' on Kobo Circle`;
  return `https://wa.me/${phoneForUrl}?text=${encodeURIComponent(message)}`;
}
