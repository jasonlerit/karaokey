import 'server-only'

import QRCode from 'qrcode'

const QR_CODE_SIZE = 384

export const createGuestQrCode = (guestUrl: string) =>
  QRCode.toDataURL(guestUrl, {
    errorCorrectionLevel: 'H',
    margin: 4,
    type: 'image/png',
    width: QR_CODE_SIZE,
  })
