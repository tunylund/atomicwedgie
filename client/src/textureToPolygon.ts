import { fixedSizeDrawingLayer, Polygon, imageToPolygon } from "tiny-game-engine/lib/index"

export function textureToPolygon(image: HTMLImageElement): Polygon {
  const w = image.width
  const h = image.height
  const layer = fixedSizeDrawingLayer(w, h)
  layer.context.drawImage(image, 0, 0)
  const imageData = layer.context.getImageData(0, 0, w, h)

  return imageToPolygon(imageData.data, imageData.width, imageData.height)
}
