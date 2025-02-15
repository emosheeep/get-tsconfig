import path from 'path';
import { testSuite, expect } from 'manten';
import { createFixture } from 'fs-fixture';
import { execaNode } from 'execa';
import { createTsconfigJson, getTscTsconfig, createPackageJson } from '../../../../utils.js';
import { parseTsconfig } from '#get-tsconfig';

export default testSuite(({ describe }) => {
	describe('node_modules', ({ describe, test }) => {
		test('prefers file over package', async () => {
			const fixture = await createFixture({
				node_modules: {
					'dep.json': createTsconfigJson({
						compilerOptions: {
							jsx: 'react-native',
						},
					}),
					'dep/tsconfig.json': createTsconfigJson({
						compilerOptions: {
							jsx: 'react',
						},
					}),
				},
				'tsconfig.json': createTsconfigJson({
					extends: 'dep',
				}),
				'file.ts': '',
			});

			const expectedTsconfig = await getTscTsconfig(fixture.path);
			delete expectedTsconfig.files;

			const tsconfig = parseTsconfig(path.join(fixture.path, 'tsconfig.json'));
			expect(tsconfig).toStrictEqual(expectedTsconfig);

			await fixture.rm();
		});

		describe('extends dependency', ({ test }) => {
			test('implicit tsconfig.json', async () => {
				const fixture = await createFixture({
					'node_modules/dep': {
						'package.json': createPackageJson({
							main: './index.js',
						}),
						'index.js': 'require("fs")',
						'tsconfig.json': createTsconfigJson({
							compilerOptions: {
								strict: true,
								jsx: 'react',
							},
						}),
					},
					'tsconfig.json': createTsconfigJson({
						extends: 'dep',
					}),
					'file.ts': '',
				});

				const expectedTsconfig = await getTscTsconfig(fixture.path);
				delete expectedTsconfig.files;

				const tsconfig = parseTsconfig(path.join(fixture.path, 'tsconfig.json'));
				expect(tsconfig).toStrictEqual(expectedTsconfig);

				await fixture.rm();
			});

			test('without package.json', async () => {
				const fixture = await createFixture({
					'node_modules/dep/tsconfig.json': createTsconfigJson({
						compilerOptions: {
							strict: true,
							jsx: 'react',
						},
					}),
					'tsconfig.json': createTsconfigJson({
						extends: 'dep',
					}),
					'file.ts': '',
				});

				const expectedTsconfig = await getTscTsconfig(fixture.path);
				delete expectedTsconfig.files;

				const tsconfig = parseTsconfig(path.join(fixture.path, 'tsconfig.json'));
				expect(tsconfig).toStrictEqual(expectedTsconfig);

				await fixture.rm();
			});

			test('ignores invalid package.json', async () => {
				const fixture = await createFixture({
					'node_modules/dep': {
						'package.json': 'invalid json',
						'some-config.json': createTsconfigJson({
							compilerOptions: {
								strict: true,
								jsx: 'react',
							},
						}),
						'tsconfig.json': createTsconfigJson({
							compilerOptions: {
								jsx: 'preserve',
							},
						}),
					},
					'tsconfig.json': createTsconfigJson({
						extends: 'dep',
					}),
					'file.ts': '',
				});

				const expectedTsconfig = await getTscTsconfig(fixture.path);
				delete expectedTsconfig.files;

				const tsconfig = parseTsconfig(path.join(fixture.path, 'tsconfig.json'));
				expect(tsconfig).toStrictEqual(expectedTsconfig);

				await fixture.rm();
			});

			test('ignores invalid package.json', async () => {
				const fixture = await createFixture({
					'node_modules/dep': {
						'package.json': 'invalid json',
						'tsconfig.json': createTsconfigJson({
							compilerOptions: {
								jsx: 'preserve',
							},
						}),
					},
					'tsconfig.json': createTsconfigJson({
						extends: 'dep',
					}),
					'file.ts': '',
				});

				const expectedTsconfig = await getTscTsconfig(fixture.path);
				delete expectedTsconfig.files;

				const tsconfig = parseTsconfig(path.join(fixture.path, 'tsconfig.json'));
				expect(tsconfig).toStrictEqual(expectedTsconfig);

				await fixture.rm();
			});

			test('empty package.json', async () => {
				const fixture = await createFixture({
					'node_modules/dep': {
						'package.json': '',
						'custom.json': createTsconfigJson({
							compilerOptions: {
								module: 'node16',
							},
						}),
						'tsconfig.json': createTsconfigJson({
							compilerOptions: {
								module: 'commonjs',
							},
						}),
					},
					'tsconfig.json': createTsconfigJson({
						extends: 'dep/custom.json',
					}),
					'file.ts': '',
				});

				const expectedTsconfig = await getTscTsconfig(fixture.path);
				delete expectedTsconfig.files;

				const tsconfig = parseTsconfig(path.join(fixture.path, 'tsconfig.json'));
				expect(tsconfig).toStrictEqual(expectedTsconfig);

				await fixture.rm();
			});

			test('empty object package.json', async () => {
				const fixture = await createFixture({
					'node_modules/dep': {
						'package.json': '{}',
						'custom.json': createTsconfigJson({
							compilerOptions: {
								module: 'node16',
							},
						}),
						'tsconfig.json': createTsconfigJson({
							compilerOptions: {
								module: 'commonjs',
							},
						}),
					},
					'tsconfig.json': createTsconfigJson({
						extends: 'dep/custom.json',
					}),
					'file.ts': '',
				});

				const expectedTsconfig = await getTscTsconfig(fixture.path);
				delete expectedTsconfig.files;

				const tsconfig = parseTsconfig(path.join(fixture.path, 'tsconfig.json'));
				expect(tsconfig).toStrictEqual(expectedTsconfig);

				await fixture.rm();
			});
		});

		describe('dependency file', ({ test }) => {
			test('direct tsconfig.json', async () => {
				const fixture = await createFixture({
					'node_modules/dep/some-file.json': createTsconfigJson({
						compilerOptions: {
							strict: true,
							jsx: 'react',
						},
					}),
					'tsconfig.json': createTsconfigJson({
						extends: 'dep/some-file.json',
					}),
					'file.ts': '',
				});

				const expectedTsconfig = await getTscTsconfig(fixture.path);
				delete expectedTsconfig.files;

				const tsconfig = parseTsconfig(path.join(fixture.path, 'tsconfig.json'));
				expect(tsconfig).toStrictEqual(expectedTsconfig);

				await fixture.rm();
			});

			test('implicit .json extension', async () => {
				const fixture = await createFixture({
					'node_modules/dep/react-native.json': createTsconfigJson({
						compilerOptions: {
							strict: true,
							jsx: 'react-native',
						},
					}),
					'tsconfig.json': createTsconfigJson({
						extends: 'dep/react-native',
					}),
					'file.ts': '',
				});

				const expectedTsconfig = await getTscTsconfig(fixture.path);
				delete expectedTsconfig.files;

				const tsconfig = parseTsconfig(path.join(fixture.path, 'tsconfig.json'));
				expect(tsconfig).toStrictEqual(expectedTsconfig);

				await fixture.rm();
			});

			test('prefers implicit .json over directory', async () => {
				const fixture = await createFixture({
					'node_modules/config-package/lib/tsconfig.json': createTsconfigJson({
						compilerOptions: {
							jsx: 'react-jsxdev',
						},
					}),
					'node_modules/config-package/lib.json': createTsconfigJson({
						compilerOptions: {
							jsx: 'react-jsx',
						},
					}),
					'tsconfig.json': createTsconfigJson({
						extends: 'config-package/lib',
					}),
					'file.ts': '',
				});

				const expectedTsconfig = await getTscTsconfig(fixture.path);
				delete expectedTsconfig.files;

				const tsconfig = parseTsconfig(path.join(fixture.path, 'tsconfig.json'));
				expect(tsconfig).toStrictEqual(expectedTsconfig);

				await fixture.rm();
			});

			test('extensionless file should not work', async () => {
				const fixture = await createFixture({
					'node_modules/dep/tsconfig': createTsconfigJson({
						compilerOptions: {
							strict: true,
							jsx: 'react-native',
						},
					}),
					'tsconfig.json': createTsconfigJson({
						extends: 'dep/tsconfig',
					}),
					'file.ts': '',
				});

				const errorMessage = 'File \'dep/tsconfig\' not found';
				await expect(
					getTscTsconfig(fixture.path),
				).rejects.toThrow(errorMessage);
				expect(() => parseTsconfig(path.join(fixture.path, 'tsconfig.json'))).toThrow(errorMessage);

				await fixture.rm();
			});

			test('arbitrary extension should not work', async () => {
				const fixture = await createFixture({
					'node_modules/dep/tsconfig.ts': createTsconfigJson({
						compilerOptions: {
							strict: true,
							jsx: 'react-native',
						},
					}),
					'tsconfig.json': createTsconfigJson({
						extends: 'dep/tsconfig.ts',
					}),
					'file.ts': '',
				});

				const errorMessage = 'File \'dep/tsconfig.ts\' not found';
				await expect(
					getTscTsconfig(fixture.path),
				).rejects.toThrow(errorMessage);
				expect(() => parseTsconfig(path.join(fixture.path, 'tsconfig.json'))).toThrow(errorMessage);

				await fixture.rm();
			});
		});

		test('directory named "tsconfig.json"', async () => {
			const fixture = await createFixture({
				'node_modules/dep/tsconfig.json/tsconfig.json': createTsconfigJson({
					compilerOptions: {
						strict: true,
						jsx: 'react',
					},
				}),
				'tsconfig.json': createTsconfigJson({
					extends: 'dep/tsconfig.json',
				}),
				'file.ts': '',
			});

			const expectedTsconfig = await getTscTsconfig(fixture.path);
			delete expectedTsconfig.files;

			const tsconfig = parseTsconfig(path.join(fixture.path, 'tsconfig.json'));
			expect(tsconfig).toStrictEqual(expectedTsconfig);

			await fixture.rm();
		});

		test('extends dependency package far', async () => {
			const fixture = await createFixture({
				'node_modules/dep/tsconfig.json': createTsconfigJson({
					compilerOptions: {
						strict: true,
						jsx: 'react',
					},
				}),
				'nested/nested/nested': {
					'tsconfig.json': createTsconfigJson({
						extends: 'dep/tsconfig.json',
					}),
					'file.ts': '',
				},
			});

			const fixturePath = `${fixture.path}/nested/nested/nested`;
			const expectedTsconfig = await getTscTsconfig(fixturePath);
			delete expectedTsconfig.files;

			const tsconfig = parseTsconfig(path.join(fixturePath, 'tsconfig.json'));
			expect(tsconfig).toStrictEqual(expectedTsconfig);

			await fixture.rm();
		});

		describe('package.json#tsconfig', ({ test }) => {
			test('package.json#tsconfig', async () => {
				const fixture = await createFixture({
					'node_modules/dep': {
						'package.json': createPackageJson({
							tsconfig: './some-config.json',
						}),
						'some-config.json': createTsconfigJson({
							compilerOptions: {
								strict: true,
								jsx: 'react',
							},
						}),
						// should be ignored
						'tsconfig.json': createTsconfigJson({
							compilerOptions: {
								jsx: 'preserve',
							},
						}),
					},
					'tsconfig.json': createTsconfigJson({
						extends: 'dep',
					}),
					'file.ts': '',
				});

				const expectedTsconfig = await getTscTsconfig(fixture.path);
				delete expectedTsconfig.files;

				const tsconfig = parseTsconfig(path.join(fixture.path, 'tsconfig.json'));
				expect(tsconfig).toStrictEqual(expectedTsconfig);

				await fixture.rm();
			});

			test('reads nested package.json#tsconfig', async () => {
				const fixture = await createFixture({
					'node_modules/dep/some-directory': {
						'package.json': createPackageJson({
							// This is ignored because its not at root
							exports: {
								'./*': null,
							},
							tsconfig: './some-config.json',
						}),
						'some-config.json': createTsconfigJson({
							compilerOptions: {
								strict: true,
								jsx: 'react',
							},
						}),
						// should be ignored
						'tsconfig.json': createTsconfigJson({
							compilerOptions: {
								jsx: 'preserve',
							},
						}),
					},
					'tsconfig.json': createTsconfigJson({
						extends: 'dep/some-directory',
					}),
					'file.ts': '',
				});

				const expectedTsconfig = await getTscTsconfig(fixture.path);
				delete expectedTsconfig.files;

				const tsconfig = parseTsconfig(path.join(fixture.path, 'tsconfig.json'));
				expect(tsconfig).toStrictEqual(expectedTsconfig);

				await fixture.rm();
			});
		});

		// TODO: test pnp package exports
		test('yarn pnp', async () => {
			const { stdout } = await execaNode('./index.js', [], {
				nodeOptions: ['--require', './.pnp.cjs'],
				cwd: './tests/fixtures/yarn-pnp',
				reject: false,
			});

			expect(stdout).toBe([
				'{ compilerOptions: { strict: true, jsx: \'react\' } }',
				'{ compilerOptions: { strict: true, jsx: \'react\' } }',
				'{ compilerOptions: { strict: true, jsx: \'react\' } }',
				'{ compilerOptions: { strict: true, jsx: \'react\' } }',
				'Error: File \'non-existent-package\' not found.',
				'Error: File \'fs/promises\' not found.',
			].join('\n'));
		});

		describe('package.json exports', ({ test, describe }) => {
			test('main', async () => {
				const fixture = await createFixture({
					'node_modules/dep': {
						'package.json': createPackageJson({
							exports: './some-config.json',
						}),
						'some-config.json': createTsconfigJson({
							compilerOptions: {
								strict: true,
								jsx: 'react',
							},
						}),
						// should be ignored
						'tsconfig.json': createTsconfigJson({
							compilerOptions: {
								jsx: 'preserve',
							},
						}),
					},
					'tsconfig.json': createTsconfigJson({
						extends: 'dep',
					}),
					'file.ts': '',
				});

				const expectedTsconfig = await getTscTsconfig(fixture.path);
				delete expectedTsconfig.files;

				const tsconfig = parseTsconfig(path.join(fixture.path, 'tsconfig.json'));
				expect(tsconfig).toStrictEqual(expectedTsconfig);

				await fixture.rm();
			});

			test('subpath', async () => {
				const fixture = await createFixture({
					'node_modules/dep': {
						'package.json': createPackageJson({
							exports: { './config': './some-config.json' },
						}),
						'some-config.json': createTsconfigJson({
							compilerOptions: {
								strict: true,
								jsx: 'react',
							},
						}),
						// should be ignored
						'tsconfig.json': createTsconfigJson({
							compilerOptions: {
								jsx: 'preserve',
							},
						}),
					},
					'tsconfig.json': createTsconfigJson({
						extends: 'dep/config',
					}),
					'file.ts': '',
				});

				const expectedTsconfig = await getTscTsconfig(fixture.path);
				delete expectedTsconfig.files;

				const tsconfig = parseTsconfig(path.join(fixture.path, 'tsconfig.json'));
				expect(tsconfig).toStrictEqual(expectedTsconfig);

				await fixture.rm();
			});

			describe('conditions', ({ test }) => {
				test('require', async () => {
					const fixture = await createFixture({
						'node_modules/dep': {
							'package.json': createPackageJson({
								exports: {
									require: './some-config.json',
								},
							}),
							'some-config.json': createTsconfigJson({
								compilerOptions: {
									strict: true,
									jsx: 'react',
								},
							}),
							// should be ignored
							'tsconfig.json': createTsconfigJson({
								compilerOptions: {
									jsx: 'preserve',
								},
							}),
						},
						'tsconfig.json': createTsconfigJson({
							extends: 'dep',
						}),
						'file.ts': '',
					});

					const expectedTsconfig = await getTscTsconfig(fixture.path);
					delete expectedTsconfig.files;

					const tsconfig = parseTsconfig(path.join(fixture.path, 'tsconfig.json'));
					expect(tsconfig).toStrictEqual(expectedTsconfig);

					await fixture.rm();
				});

				test('types', async () => {
					const fixture = await createFixture({
						'node_modules/dep': {
							'package.json': createPackageJson({
								exports: {
									types: './some-config.json',
								},
							}),
							'some-config.json': createTsconfigJson({
								compilerOptions: {
									strict: true,
									jsx: 'react',
								},
							}),
							// should be ignored
							'tsconfig.json': createTsconfigJson({
								compilerOptions: {
									jsx: 'preserve',
								},
							}),
						},
						'tsconfig.json': createTsconfigJson({
							extends: 'dep',
						}),
						'file.ts': '',
					});

					const expectedTsconfig = await getTscTsconfig(fixture.path);
					delete expectedTsconfig.files;

					const tsconfig = parseTsconfig(path.join(fixture.path, 'tsconfig.json'));
					expect(tsconfig).toStrictEqual(expectedTsconfig);

					await fixture.rm();
				});

				test('missing condition should fail', async () => {
					const fixture = await createFixture({
						'node_modules/dep': {
							'package.json': createPackageJson({
								exports: {
									asdf: './some-config.json',
								},
							}),
							'some-config.json': createTsconfigJson({
								compilerOptions: {
									strict: true,
									jsx: 'react',
								},
							}),
							// should be ignored
							'tsconfig.json': createTsconfigJson({
								compilerOptions: {
									jsx: 'preserve',
								},
							}),
						},
						'tsconfig.json': createTsconfigJson({
							extends: 'dep',
						}),
						'file.ts': '',
					});

					const errorMessage = 'File \'dep\' not found.';
					await expect(
						getTscTsconfig(fixture.path),
					).rejects.toThrow(errorMessage);
					expect(
						() => parseTsconfig(path.join(fixture.path, 'tsconfig.json')),
					).toThrow(errorMessage);

					await fixture.rm();
				});
			});

			test('missing subpath should fail', async () => {
				const fixture = await createFixture({
					'node_modules/dep': {
						'package.json': createPackageJson({
							exports: {
								'./config': './some-config.json',
							},
						}),
						'some-config.json': createTsconfigJson({
							compilerOptions: {
								strict: true,
								jsx: 'react',
							},
						}),
						// should be ignored
						'tsconfig.json': createTsconfigJson({
							compilerOptions: {
								jsx: 'preserve',
							},
						}),
					},
					'tsconfig.json': createTsconfigJson({
						extends: 'dep/missing',
					}),
					'file.ts': '',
				});

				const errorMessage = 'File \'dep/missing\' not found.';
				await expect(
					getTscTsconfig(fixture.path),
				).rejects.toThrow(errorMessage);
				expect(
					() => parseTsconfig(path.join(fixture.path, 'tsconfig.json')),
				).toThrow(errorMessage);

				await fixture.rm();
			});

			// Seems like a TypeScript bug
			test('null exports should resolve tsconfig.json', async () => {
				const fixture = await createFixture({
					'node_modules/dep': {
						'package.json': createPackageJson({
							exports: null,
						}),

						'tsconfig.json': createTsconfigJson({
							compilerOptions: {
								jsx: 'react-native',
							},
						}),
					},
					'tsconfig.json': createTsconfigJson({
						extends: 'dep',
					}),
					'file.ts': '',
				});

				const expectedTsconfig = await getTscTsconfig(fixture.path);
				delete expectedTsconfig.files;

				const tsconfig = parseTsconfig(path.join(fixture.path, 'tsconfig.json'));
				expect(tsconfig).toStrictEqual(expectedTsconfig);

				await fixture.rm();
			});

			test('null exports should resolve tsconfig.json in directory', async () => {
				const fixture = await createFixture({
					'node_modules/dep': {
						'package.json': createPackageJson({
							exports: null,
						}),

						'some-directory/tsconfig.json': createTsconfigJson({
							compilerOptions: {
								jsx: 'react-jsx',
							},
						}),
					},
					'tsconfig.json': createTsconfigJson({
						extends: 'dep/some-directory',
					}),
					'file.ts': '',
				});

				const expectedTsconfig = await getTscTsconfig(fixture.path);
				delete expectedTsconfig.files;

				const tsconfig = parseTsconfig(path.join(fixture.path, 'tsconfig.json'));
				expect(tsconfig).toStrictEqual(expectedTsconfig);

				await fixture.rm();
			});

			test('path block should not resolve tsconfig.json', async () => {
				const fixture = await createFixture({
					'node_modules/dep': {
						'package.json': createPackageJson({
							exports: {
								'./*': null,
							},
						}),

						'tsconfig.json': createTsconfigJson({
							compilerOptions: {
								jsx: 'react-native',
							},
						}),
					},
					'tsconfig.json': createTsconfigJson({
						extends: 'dep',
					}),
					'file.ts': '',
				});

				const errorMessage = 'File \'dep\' not found.';
				await expect(
					getTscTsconfig(fixture.path),
				).rejects.toThrow(errorMessage);
				expect(
					() => parseTsconfig(path.join(fixture.path, 'tsconfig.json')),
				).toThrow(errorMessage);

				await fixture.rm();
			});

			test('package.json ignored in nested directory', async () => {
				const fixture = await createFixture({
					'node_modules/dep/a': {
						'package.json': createPackageJson({
							exports: {
								'./*': null,
							},
						}),
						'tsconfig.json': createTsconfigJson({
							compilerOptions: {
								jsx: 'react-native',
							},
						}),
					},
					'tsconfig.json': createTsconfigJson({
						extends: 'dep/a',
					}),
					'file.ts': '',
				});

				const expectedTsconfig = await getTscTsconfig(fixture.path);
				delete expectedTsconfig.files;

				const tsconfig = parseTsconfig(path.join(fixture.path, 'tsconfig.json'));
				expect(tsconfig).toStrictEqual(expectedTsconfig);

				await fixture.rm();
			});
		});
	});
});
