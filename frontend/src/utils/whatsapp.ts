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
  const encoded = encodeURIComponent(message);

  if (url.includes('wa.me/') || url.includes('api.whatsapp.com/') || url.includes('whatsapp.com/send')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}text=${encoded}`;
  }
  return url;
};

