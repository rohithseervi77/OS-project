/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig = {
  reactStrictMode: false,
  ...(isGithubPages ? {
    output: 'export',
    basePath: '/OS-project',
    images: { unoptimized: true },
  } : {}),
};

export default nextConfig;
