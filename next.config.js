/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // 바이너리 파일을 웹팩 빌드에서 제외합니다
    config.externals = [...(config.externals || []), 
      { sharp: 'commonjs sharp' },
      { 'onnxruntime-node': 'commonjs onnxruntime-node' }
    ];

    // transformers 패키지의 바이너리 파일 처리
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }

    // ONNX 런타임 관련 바이너리 파일 무시
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /\.node$/,
      use: 'null-loader',
      exclude: /node_modules/,
    });

    return config;
  },
}

module.exports = nextConfig 