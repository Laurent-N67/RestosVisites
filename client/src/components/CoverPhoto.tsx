import { resolvePhotoUrl } from '../api/client.ts'

interface CoverPhotoProps {
  url?: string
  alt: string
}

function CoverPhoto({ url, alt }: CoverPhotoProps) {
  return (
    <div className="cover-photo">
      {url ? (
        <img src={resolvePhotoUrl(url)} alt={alt} loading="lazy" />
      ) : (
        <div className="cover-photo-placeholder" aria-hidden="true">
          🍽️
        </div>
      )}
    </div>
  )
}

export default CoverPhoto
