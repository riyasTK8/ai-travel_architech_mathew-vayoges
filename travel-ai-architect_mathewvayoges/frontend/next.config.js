/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    domains: ["source.unsplash.com", "images.unsplash.com"],
  },
};

module.exports = nextConfig;
