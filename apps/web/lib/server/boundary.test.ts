import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('web server boundary', () => {
  it('marks every server helper as server-only', async () => {
    const files: string[] = [];
    for await (const file of glob('apps/web/lib/server/**/*.ts'))
      if (!file.endsWith('.test.ts')) files.push(file);
    await Promise.all(
      files.map(async (file) =>
        expect(await readFile(file, 'utf8')).toMatch(/^import 'server-only';/),
      ),
    );
  });

  it('keeps service-role credentials out of client source', async () => {
    const files: string[] = [];
    for await (const file of glob('apps/web/{app,components,features,lib}/**/*.{ts,tsx}'))
      files.push(file);
    const source = await Promise.all(
      files
        .filter(
          (file) =>
            !file.replaceAll('\\', '/').includes('/lib/server/') && !file.endsWith('.test.ts'),
        )
        .map((file) => readFile(file, 'utf8')),
    );
    expect(source.join('\n')).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY|service[_-]?role/i);
  });
});
