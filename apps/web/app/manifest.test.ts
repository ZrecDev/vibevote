import manifest from './manifest';

describe('web manifest', () => {
  it('declares an installable standalone app with icons', () => {
    expect(manifest()).toMatchObject({
      name: 'VibeVote',
      display: 'standalone',
      start_url: '/',
      icons: expect.arrayContaining([expect.objectContaining({ purpose: 'maskable' })]),
    });
  });
});
