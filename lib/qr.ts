import QRCode from 'qrcode'

export async function generateQRCodeDataURL(token: string, appUrl: string): Promise<string> {
  const url = `${appUrl}/ticket/${token}`
  return QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: { dark: '#1a1a1a', light: '#ffffff' },
  })
}

export async function generateQRCodeBuffer(token: string, appUrl: string): Promise<Buffer> {
  const url = `${appUrl}/ticket/${token}`
  return QRCode.toBuffer(url, { width: 300, margin: 2 })
}
