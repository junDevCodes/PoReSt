// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import cloudflare from '@astrojs/cloudflare';
import keystatic from '@keystatic/astro';

// https://astro.build/config
export default defineConfig({
  adapter: cloudflare(),
  integrations: [tailwind(), react(), mdx(), keystatic()],
  output: 'server',
  
  vite: {
    resolve: {
      alias: {
        'yjs': 'yjs'
      }
    },
    build: {
      commonjsOptions: {
        transformMixedEsModules: true,
      }
    }
  }
});