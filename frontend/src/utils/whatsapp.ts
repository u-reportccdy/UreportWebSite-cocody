export const memberStatusLabel = (status: string) => {
  if (status === 'aspirant') return 'Aspirant';
  if (status === 'ureporter') return 'U-Reporter';
  if (status === 'mentor') return 'Mentor';
  return status || '';
};

export const fillTemplate = (template: string, data: Record<string, string>) => {
  let output = template || '';
  Object.entries(data).forEach(([key, value]) => {
    output = output.replaceAll(`{${key}}`, value ?? '');
  });
  return output;
};

export const buildWhatsAppLink = (baseUrl: string, message: string) => {
  const url = (baseUrl || '').trim();
  if (!url) return '';

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname;

    const isWaMe = host === 'wa.me';
    const isApiWhatsApp = host === 'api.whatsapp.com';
    const isWhatsAppSend = (host === 'whatsapp.com' || host === 'www.whatsapp.com') && path === '/send';

    if (isWaMe || isApiWhatsApp || isWhatsAppSend) {
      parsed.searchParams.set('text', message ?? '');
      return parsed.toString();
    }
  } catch {
    // Keep existing behavior for invalid URLs.
  }

  return url;
};

