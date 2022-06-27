import path from 'path';
import { testSuite, expect } from 'manten';
import { getTsconfig, createPathsMatcher } from '../../dist/index.js';
import { createFixture, tsconfigJson } from '../utils/create-fixture';

/**
 * Resolution is tested against the TypeScript compiler using:
 * npx tsc --traceResolution --noEmit
 */

export default testSuite(({ describe }) => {
	describe('paths', ({ describe, test }) => {
		describe('error cases', ({ test }) => {
			test('no baseUrl or paths', async () => {
				const fixture = await createFixture({
					'tsconfig.json': tsconfigJson({
						compilerOptions: {},
					}),
				});

				const tsconfig = getTsconfig(fixture.path);
				expect(tsconfig).not.toBeNull();
				expect(createPathsMatcher(tsconfig!)).toBeNull();

				await fixture.cleanup();
			});

			test('no baseUrl & non-relative paths', async () => {
				const fixture = await createFixture({
					'tsconfig.json': tsconfigJson({
						compilerOptions: {
							paths: {
								'@': ['src'],
							},
						},
					}),
				});

				const tsconfig = getTsconfig(fixture.path);
				expect(tsconfig).not.toBeNull();
				expect(() => createPathsMatcher(tsconfig!)).toThrow('Non-relative paths are not allowed when \'baseUrl\' is not set. Did you forget a leading \'./\'?');

				await fixture.cleanup();
			});

			test('multiple * in pattern', async () => {
				const fixture = await createFixture({
					'tsconfig.json': tsconfigJson({
						compilerOptions: {
							paths: {
								'a/*/*': ['src'],
							},
						},
					}),
				});

				const tsconfig = getTsconfig(fixture.path);
				expect(tsconfig).not.toBeNull();
				expect(() => createPathsMatcher(tsconfig!)).toThrow('Pattern \'a/*/*\' can have at most one \'*\' character.');

				await fixture.cleanup();
			});

			test('multiple * in substitution', async () => {
				const fixture = await createFixture({
					'tsconfig.json': tsconfigJson({
						compilerOptions: {
							paths: {
								'a/*': ['*/*'],
							},
						},
					}),
				});

				const tsconfig = getTsconfig(fixture.path);
				expect(tsconfig).not.toBeNull();
				expect(() => createPathsMatcher(tsconfig!)).toThrow('Substitution \'*/*\' in pattern \'a/*\' can have at most one \'*\' character.');

				await fixture.cleanup();
			});

			test('no match', async () => {
				const fixture = await createFixture({
					'tsconfig.json': tsconfigJson({
						compilerOptions: {
							paths: {
								'no-match': ['./b'],
							},
						},
					}),
				});

				const tsconfig = getTsconfig(fixture.path);
				expect(tsconfig).not.toBeNull();

				const matcher = createPathsMatcher(tsconfig!)!;

				expect(matcher).not.toBeNull();
				expect(matcher('specifier')).toStrictEqual([]);

				await fixture.cleanup();
			});
		});

		test('baseUrl', async () => {
			const fixture = await createFixture({
				'tsconfig.json': tsconfigJson({
					compilerOptions: {
						baseUrl: '.',
					},
				}),
			});

			const tsconfig = getTsconfig(fixture.path);
			expect(tsconfig).not.toBeNull();

			const matcher = createPathsMatcher(tsconfig!)!;

			expect(matcher).not.toBeNull();
			expect(matcher('exactMatch')).toStrictEqual([
				path.join(fixture.path, 'exactMatch'),
			]);

			await fixture.cleanup();
		});

		test('baseUrl from extends', async () => {
			const fixture = await createFixture({
				'some-dir/tsconfig.json': tsconfigJson({
					compilerOptions: {
						baseUrl: '..',
						paths: {
							$lib: [
								'src/lib',
							],
							'$lib/*': [
								'src/lib/*',
							],
						},
					},
				}),
				'tsconfig.json': tsconfigJson({
					extends: './some-dir/tsconfig.json',
				}),
			});

			const tsconfig = getTsconfig(fixture.path);
			expect(tsconfig).not.toBeNull();

			const matcher = createPathsMatcher(tsconfig!)!;

			expect(matcher).not.toBeNull();
			expect(matcher('$lib')).toStrictEqual([
				path.join(fixture.path, 'src/lib'),
			]);

			await fixture.cleanup();
		});

		test('exact match', async () => {
			const fixture = await createFixture({
				'tsconfig.json': tsconfigJson({
					compilerOptions: {
						paths: {
							exactMatch: ['./b'],
						},
					},
				}),
			});

			const tsconfig = getTsconfig(fixture.path);
			expect(tsconfig).not.toBeNull();

			const matcher = createPathsMatcher(tsconfig!)!;

			expect(matcher).not.toBeNull();
			expect(matcher('exactMatch')).toStrictEqual([
				path.join(fixture.path, 'b'),
			]);

			await fixture.cleanup();
		});

		// #17
		test('exact match with parent path', async () => {
			const fixture = await createFixture({
				'tsconfig.json': tsconfigJson({
					compilerOptions: {
						paths: {
							exactMatch: ['../src'],
						},
					},
				}),
			});

			const tsconfig = getTsconfig(fixture.path);
			expect(tsconfig).not.toBeNull();

			const matcher = createPathsMatcher(tsconfig!)!;

			expect(matcher).not.toBeNull();
			expect(matcher('exactMatch')).toStrictEqual([
				path.join(fixture.path, '../src'),
			]);

			await fixture.cleanup();
		});

		test('exact match with wildcard', async () => {
			const fixture = await createFixture({
				'tsconfig.json': tsconfigJson({
					compilerOptions: {
						paths: {
							exactMatch: ['./b/*'],
						},
					},
				}),
			});

			const tsconfig = getTsconfig(fixture.path);
			expect(tsconfig).not.toBeNull();

			const matcher = createPathsMatcher(tsconfig!)!;

			expect(tsconfig).not.toBeNull();
			expect(matcher('exactMatch')).toStrictEqual([
				path.join(fixture.path, 'b/*'),
			]);

			await fixture.cleanup();
		});

		test('prefix match', async () => {
			const fixture = await createFixture({
				'tsconfig.json': tsconfigJson({
					compilerOptions: {
						paths: {
							'prefix-*': ['./prefixed/*'],
						},
					},
				}),
			});

			const tsconfig = getTsconfig(fixture.path);
			expect(tsconfig).not.toBeNull();

			const matcher = createPathsMatcher(tsconfig!)!;

			expect(tsconfig).not.toBeNull();
			expect(matcher('prefix-specifier')).toStrictEqual([
				path.join(fixture.path, 'prefixed/specifier'),
			]);

			await fixture.cleanup();
		});

		test('suffix match', async () => {
			const fixture = await createFixture({
				'tsconfig.json': tsconfigJson({
					compilerOptions: {
						paths: {
							'*-suffix': ['./suffixed/*'],
						},
					},
				}),
			});

			const tsconfig = getTsconfig(fixture.path);
			expect(tsconfig).not.toBeNull();

			const matcher = createPathsMatcher(tsconfig!)!;

			expect(tsconfig).not.toBeNull();
			expect(matcher('specifier-suffix')).toStrictEqual([
				path.join(fixture.path, 'suffixed/specifier'),
			]);

			await fixture.cleanup();
		});

		test('doesnt match current directory', async () => {
			const fixture = await createFixture({
				'tsconfig.json': tsconfigJson({
					compilerOptions: {
						paths: {
							'.': ['./a'],
						},
					},
				}),
			});

			const tsconfig = getTsconfig(fixture.path);
			expect(tsconfig).not.toBeNull();

			const matcher = createPathsMatcher(tsconfig!)!;

			expect(tsconfig).not.toBeNull();
			expect(matcher('.')).toStrictEqual([]);

			await fixture.cleanup();
		});

		test('doesnt match parent directory', async () => {
			const fixture = await createFixture({
				'tsconfig.json': tsconfigJson({
					compilerOptions: {
						paths: {
							'..': ['./a'],
						},
					},
				}),
			});

			const tsconfig = getTsconfig(fixture.path);
			expect(tsconfig).not.toBeNull();

			const matcher = createPathsMatcher(tsconfig!)!;

			expect(tsconfig).not.toBeNull();
			expect(matcher('..')).toStrictEqual([]);

			await fixture.cleanup();
		});

		test('doesnt match relative paths', async () => {
			const fixture = await createFixture({
				'tsconfig.json': tsconfigJson({
					compilerOptions: {
						paths: {
							'./relative': ['./a'],
						},
					},
				}),
			});

			const tsconfig = getTsconfig(fixture.path);
			expect(tsconfig).not.toBeNull();

			const matcher = createPathsMatcher(tsconfig!)!;

			expect(tsconfig).not.toBeNull();
			expect(matcher('./relative')).toStrictEqual([]);

			await fixture.cleanup();
		});

		test('matches absolute paths', async () => {
			const fixture = await createFixture({
				'tsconfig.json': tsconfigJson({
					compilerOptions: {
						paths: {
							'/absolute': ['./a'],
						},
					},
				}),
			});

			const tsconfig = getTsconfig(fixture.path);
			expect(tsconfig).not.toBeNull();

			const matcher = createPathsMatcher(tsconfig!)!;

			expect(tsconfig).not.toBeNull();
			expect(matcher('/absolute')).toStrictEqual([path.join(fixture.path, 'a')]);

			await fixture.cleanup();
		});

		test('matches path that starts with .', async () => {
			const fixture = await createFixture({
				'tsconfig.json': tsconfigJson({
					compilerOptions: {
						paths: {
							'.src': ['./src'],
						},
					},
				}),
			});

			const tsconfig = getTsconfig(fixture.path);
			expect(tsconfig).not.toBeNull();

			const matcher = createPathsMatcher(tsconfig!)!;

			expect(tsconfig).not.toBeNull();
			expect(matcher('.src')).toStrictEqual([path.join(fixture.path, 'src')]);

			await fixture.cleanup();
		});
	});
});
