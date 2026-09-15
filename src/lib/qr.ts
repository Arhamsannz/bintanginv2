import QRCode from 'qrcode'

// Shared rendering options so every QR code on the site — single preview
// or bulk generator — comes out with the same physical properties:
// pure black on white, no gradients, generous quiet zone, and the highest
// error-correction level so a printed, slightly worn or laminated card
// still scans reliably.
const QR_RENDER_OPTIONS = {
  errorCorrectionLevel: 'H' as const,
  margin: 4,
  color: {
    dark: '#000000',
    light: '#FFFFFF',
  },
}

export function cardUrl(origin: string, code: string): string {
  return `${origin}/q/${code}`
}

export async function generateQrPngDataUrl(
  text: string,
  size = 512,
): Promise<string> {
  return QRCode.toDataURL(text, {
    ...QR_RENDER_OPTIONS,
    width: size,
    type: 'image/png',
  })
}

export async function generateQrSvgString(text: string): Promise<string> {
  return QRCode.toString(text, {
    ...QR_RENDER_OPTIONS,
    type: 'svg',
  })
}

export function formatCardCode(prefix: string, number: number, padLength = 4): string {
  return `${prefix}${String(number).padStart(padLength, '0')}`
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mimeMatch = /data:(.*);base64/.exec(header)
  const mime = mimeMatch ? mimeMatch[1] : 'image/png'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
