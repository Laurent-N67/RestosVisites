// Régénère les icônes PWA/favicon à partir de client/icon-source.png.
// Usage (depuis client/) : node scripts/generate-icons.mjs
import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const clientDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = path.join(clientDir, 'public')
// Source : client/icon-source.png (hors de public/ pour ne pas être servie/bundlée en prod)
const src = path.join(clientDir, 'icon-source.png')

// Couleur du cercle bleu marine de la source (échantillonnée sur plusieurs points du cercle plein).
const NAVY = '#19344d'

async function main() {
  // IMPORTANT : icon-source.png n'a PAS de canal alpha (hasAlpha === false). Le "fond
  // transparent" visible à l'œil est en réalité un damier gris/blanc figé dans les pixels
  // (probablement une capture d'un logiciel de design affichant sa grille de transparence).
  // Il faut donc reconstruire une vraie transparence en masquant tout ce qui est hors du
  // cercle bleu marine (détecté par scan de pixels : centre ~(200.5, 200.5), rayon ~198-199
  // sur un canvas 402x402) avant tout redimensionnement, sinon le damier se retrouve
  // recopié tel quel (agrandi) dans toutes les icônes générées.
  const meta = await sharp(src).metadata()
  const w = meta.width
  const h = meta.height
  const cx = w / 2
  const cy = h / 2
  const radius = Math.min(w, h) / 2 - 3 // marge de sécurité pour ne pas capter le damier résiduel

  const circleMask = Buffer.from(
    `<svg width="${w}" height="${h}"><circle cx="${cx}" cy="${cy}" r="${radius}" fill="#fff" /></svg>`,
  )

  // Source "propre" avec vraie transparence hors du cercle, réutilisée pour toutes les icônes.
  const cleanSrc = await sharp(src)
    .ensureAlpha()
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .png()
    .toBuffer()

  // pwa-192x192.png (purpose: any) — simple redimensionnement, transparence conservée
  await sharp(cleanSrc).resize(192, 192).png().toFile(path.join(publicDir, 'pwa-192x192.png'))

  // pwa-512x512.png (purpose: any)
  await sharp(cleanSrc).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-512x512.png'))

  // pwa-maskable-512x512.png (purpose: maskable)
  // Le motif doit tenir dans le cercle de sécurité (~80% du canvas), donc on redimensionne
  // la source à ~410px et on la centre sur un canvas 512x512 avec un fond bleu marine plein
  // (pas de transparence : au recadrage maskable, la zone hors du cercle de sécurité peut
  // rester visible selon la forme du masque, un fond uni évite tout artefact transparent).
  const maskableInner = 410
  const resizedInner = await sharp(cleanSrc).resize(maskableInner, maskableInner).png().toBuffer()
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: NAVY,
    },
  })
    .composite([{ input: resizedInner, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'))

  // apple-touch-icon.png (180x180) — iOS gère mal la transparence, on aplati sur fond bleu marine
  await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: NAVY,
    },
  })
    .composite([{ input: await sharp(cleanSrc).resize(180, 180).png().toBuffer(), gravity: 'center' }])
    .flatten({ background: NAVY })
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'))

  // favicon-48x48.png — pour l'onglet du navigateur, transparence conservée
  await sharp(cleanSrc).resize(48, 48).png().toFile(path.join(publicDir, 'favicon-48x48.png'))

  console.log('Icônes générées avec succès dans', publicDir)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
