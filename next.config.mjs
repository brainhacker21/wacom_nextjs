/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer, dev }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true, // Izinkan pemuatan WebAssembly
      layers: true,
    };

    // Salin file .wasm ke direktori output statis
    // Ini adalah cara yang lebih modern dan direkomendasikan
    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });

    return config;
  },
};

export default nextConfig;