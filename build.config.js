import { resolve } from 'node:path';
import YamlLoader from 'bun-loader-yaml';

const isRelease = Bun.env.BUN_ENV === 'production';

const PROJECT_ROOT = import.meta.dir;
const SRC_DIR = resolve(PROJECT_ROOT, 'src');
const DIST_DIR = resolve(PROJECT_ROOT, 'dist');

export default {
  entrypoints: [resolve(SRC_DIR, 'index.js'), resolve(SRC_DIR, 'blocks.js')],
  root: SRC_DIR,
  outdir: DIST_DIR,
  naming: {
    asset: 'assets/[name]-[hash].[ext]',
  },
  minify: isRelease,
  plugins: [YamlLoader()],
  external: ['preact', 'preact/hooks', `preact/jsx-${isRelease ? '' : 'dev-'}runtime`, '@blockcode/ui'],
};
