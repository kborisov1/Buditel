try {
  // One .env at the repo root serves every package.
  process.loadEnvFile(new URL('../../.env', import.meta.url));
} catch {
  // No .env file: rely on the environment (hosting).
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@buditel/core', '@buditel/schema', '@buditel/player', '@buditel/editor'],
};

export default nextConfig;
