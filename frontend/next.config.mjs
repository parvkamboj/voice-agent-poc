/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep livekit-server-sdk out of the webpack bundle — it uses node: builtins
  // that webpack can't handle. It only runs in API routes (Node.js runtime).
  serverExternalPackages: ['livekit-server-sdk'],
}

export default nextConfig
