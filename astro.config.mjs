// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import keystatic from '@keystatic/astro';

// https://astro.build/config
export default defineConfig({
  adapter: cloudflare(),
  integrations: [react(), keystatic()]
});