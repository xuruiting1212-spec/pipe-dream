/** 将 Blob 生成 500px 宽缩略图 */
export async function makeThumb(blob: Blob, maxW = 500): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(maxW / img.width, 1)
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const c = document.createElement('canvas')
      c.width = w; c.height = h
      c.getContext('2d')!.drawImage(img, 0, 0, w, h)
      c.toBlob(b => resolve(b!), 'image/jpeg', 0.85)
    }
    img.src = URL.createObjectURL(blob)
  })
}
