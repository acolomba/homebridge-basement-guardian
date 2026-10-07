import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

test('SonarCloud reports the package version', async () => {
  // arrange
  const root = new URL('../../../', import.meta.url);
  const manifest = JSON.parse(await readFile(new URL('package.json', root), 'utf8')) as { version: string };
  const properties = await readFile(new URL('sonar-project.properties', root), 'utf8');

  // act
  const sonarVersion = /^sonar\.projectVersion=(.*)$/m.exec(properties)?.[1];

  // assert
  assert.strictEqual(sonarVersion, manifest.version);
});
