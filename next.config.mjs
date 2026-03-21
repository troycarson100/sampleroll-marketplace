/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev }) => {
    if (dev) {
      // Stale webpack filesystem cache often causes "Cannot find module './682.js'"
      // and "__webpack_modules__[moduleId] is not a function" after HMR / dependency edits.
      // Slower compiles, fewer mystery chunk errors. Set NEXT_WEBPACK_FS_CACHE=1 to opt back in.
      if (process.env.NEXT_WEBPACK_FS_CACHE !== "1") {
        config.cache = false;
      }
    }
    return config;
  },
};

export default nextConfig;
