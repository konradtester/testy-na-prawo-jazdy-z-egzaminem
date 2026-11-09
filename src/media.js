import { CDN_MEDIA_BASE } from './state.js';
import {
  elMediaWrapper, elVideoBox, elVideo, elImageBox, elImage,
  elMediaFallback, elMediaFallbackText
} from './dom.js';

// ==========================================================================
// Media Rendering (video / image, with CDN → local-folder fallback chain)
// ==========================================================================
export function renderMedia(q) {
  // Reset video state
  elVideo.pause();
  elVideo.removeAttribute('src');
  elVideo.load();
  elVideoBox.classList.add('hidden');
  elImageBox.classList.add('hidden');
  elMediaFallback.classList.add('hidden');

  if (!q.media) {
    elMediaWrapper.classList.add('empty');
    return;
  }

  elMediaWrapper.classList.remove('empty');

  if (q.mediaType === 'video') {
    elVideoBox.classList.remove('hidden');

    const cdnUrl = `${CDN_MEDIA_BASE}/vid/${encodeURIComponent(q.mediaStem)}.mp4`;
    const localUrl = `media/${q.media}`;

    let videoAttempt = 0;
    elVideo.onerror = function() {
      videoAttempt++;
      if (videoAttempt === 1) {
        elVideo.src = localUrl;
      } else {
        elVideo.onerror = null;
        elVideoBox.classList.add('hidden');
        elMediaFallbackText.textContent = `Wideo niedostępne: ${q.media}`;
        elMediaFallback.classList.remove('hidden');
      }
    };

    elVideo.src = cdnUrl;

    // Auto play video muted on first appearance
    elVideo.muted = true;
    elVideo.play().catch(() => {
      // Autoplay policy might block unmuted or first load, normal behavior
    });

  } else if (q.mediaType === 'image') {
    elImageBox.classList.remove('hidden');

    const cdnWebpUrl = `${CDN_MEDIA_BASE}/img/${encodeURIComponent(q.mediaStem)}.webp`;
    const cdnDirectUrl = `${CDN_MEDIA_BASE}/img/${encodeURIComponent(q.media)}`;
    const localUrl = `media/${q.media}`;

    let imageAttempt = 0;
    elImage.onerror = function() {
      imageAttempt++;
      if (imageAttempt === 1) {
        elImage.src = cdnDirectUrl;
      } else if (imageAttempt === 2) {
        elImage.src = localUrl;
      } else {
        elImage.onerror = null;
        elImageBox.classList.add('hidden');
        elMediaFallbackText.textContent = `Zdjęcie niedostępne: ${q.media}`;
        elMediaFallback.classList.remove('hidden');
      }
    };

    elImage.src = cdnWebpUrl;
  } else {
    elMediaWrapper.classList.add('empty');
  }
}
