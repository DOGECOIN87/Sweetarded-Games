import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const projectRoot = __dirname;

export default defineConfig(({ mode }) => {
  const game = mode === 'radbro-coinpusher' ? 'coinpusher' : 'slots';
  const root = path.resolve(projectRoot, 'radbro', game);
  const stub = (name: string) => path.resolve(projectRoot, 'src/radbro/stubs', name);

  return {
    root,
    base: './',
    publicDir: false,
    plugins: [
      react(),
      {
        name: 'radbro-relative-css-assets',
        generateBundle(_options, bundle) {
          for (const output of Object.values(bundle)) {
            if (output.type !== 'asset' || !output.fileName.endsWith('.css')) continue;
            const css = String(output.source)
              .replaceAll('url(/fonts/', 'url(../fonts/')
              .replaceAll('url("/fonts/', 'url("../fonts/')
              .replaceAll("url('/fonts/", "url('../fonts/");
            output.source = css;
          }
        },
      },
    ],
    resolve: {
      alias: [
        { find: '@', replacement: path.resolve(projectRoot, 'src') },
        { find: '@solana/wallet-adapter-react', replacement: stub('walletAdapterReact.ts') },
        { find: '@solana/wallet-adapter-react-ui', replacement: stub('walletAdapterReactUi.ts') },
        { find: '@solana/web3.js', replacement: stub('web3.ts') },
        { find: '../../lib/useJunkPusherOnChain', replacement: stub('onChain.ts') },
        { find: '../../lib/tokenService', replacement: stub('tokenService.ts') },
        { find: '../../lib/tokenConfig', replacement: stub('tokenConfig.ts') },
        { find: '../../lib/JunkPusherClient', replacement: stub('junkPusherClient.ts') },
        { find: '../../lib/highScoreService', replacement: stub('highScoreService.ts') },
        { find: '../../services/gameConfigService', replacement: stub('gameServices.ts') },
        { find: '../../services/activityService', replacement: stub('activityService.ts') },
        { find: '../../services/leaderboardService', replacement: stub('leaderboardService.ts') },
      ],
    },
    define: {
      'process.env': '{}',
      global: 'globalThis',
    },
    build: {
      outDir: path.resolve(projectRoot, 'dist-radbro', game),
      emptyOutDir: true,
      target: 'es2020',
      minify: 'terser',
      sourcemap: false,
      copyPublicDir: false,
    },
  };
});
