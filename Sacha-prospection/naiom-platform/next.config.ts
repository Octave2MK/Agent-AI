import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    localPatterns: [
      { pathname: "/avatars/**", search: "?v=3" },
      { pathname: "/avatars/**", search: "?v=4-funko" },
      { pathname: "/avatars/**", search: "?v=5-cutout" },
      { pathname: "/avatars/**", search: "" },
      { pathname: "/avatars-pixel/**", search: "?v=4-pixel" },
      { pathname: "/avatars-pixel/**", search: "?v=5-svg" },
      { pathname: "/avatars-pixel/**", search: "" },
    ],
  },
};

export default nextConfig;
