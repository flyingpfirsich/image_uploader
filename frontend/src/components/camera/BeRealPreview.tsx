import type { BeRealPhotos, MainPhotoPosition } from '../../types';

interface BeRealPreviewProps {
  beRealPhotos: BeRealPhotos;
  mainPhotoPosition: MainPhotoPosition;
  onSwap: () => void;
}

export function BeRealPreview({ beRealPhotos, mainPhotoPosition, onSwap }: BeRealPreviewProps) {
  if (!beRealPhotos.front || !beRealPhotos.back) return null;

  const mainPhoto = mainPhotoPosition === 'front' ? beRealPhotos.front : beRealPhotos.back;
  const overlayPhoto = mainPhotoPosition === 'front' ? beRealPhotos.back : beRealPhotos.front;

  return (
    <div className="bereal-preview" onClick={onSwap}>
      {/* Main photo */}
      <img src={mainPhoto.url} alt="Main" className="bereal-main" />
      {/* Overlay photo (smaller, in corner) */}
      <div className="bereal-overlay-container">
        <img src={overlayPhoto.url} alt="Overlay" className="bereal-overlay" />
        <span className="bereal-swap-hint">TAP</span>
      </div>
    </div>
  );
}
