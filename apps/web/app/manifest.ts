import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VibeVote',
    short_name: 'VibeVote',
    description: 'A fair group decision, in minutes.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8f5ef',
    theme_color: '#d96545',
    icons: [
      { src: '/icons/vibevote.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      {
        src: '/icons/vibevote-maskable.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
