// Turns a stored WhatsApp number (any of "08123...", "+62 812...",
// "628123...") into a wa.me link. Only digits are kept; a leading 0 is
// swapped for Indonesia's 62 country code since that's the vast majority
// of numbers customers will type in on the activation form.
export function whatsappLink(rawNumber: string, message?: string): string {
  const digits = rawNumber.replace(/\D/g, '')
  const normalized = digits.startsWith('0') ? `62${digits.slice(1)}` : digits
  const query = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${normalized}${query}`
}
