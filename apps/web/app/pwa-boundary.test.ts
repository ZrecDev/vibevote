import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('PWA privacy boundary', () => {
  it('keeps API and private room material out of the service-worker cache', () => {
    const source = readFileSync(resolve(__dirname, '../public/sw.js'), 'utf8');
    expect(source).toContain("pathname.startsWith('/api/')");
    expect(source).not.toMatch(
      /participantAccessToken|localStorage|sessionStorage|private_ballots/,
    );
  });
});
