import {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
 
const nextConfig: NextConfig = {
    compiler: {
    /*
    // Remove console logs only in production, excluding error logs
    removeConsole: process.env.NODE_ENV === "production" ? { 
        exclude: ["error", "warn", "info", "log"] 
    } : false
    */
  },

    // make sure these pkgs stay external (prevents bundling issues)
  experimental: {
    serverComponentsExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  },
  // explicitly include chromium's brotli assets in the output
  outputFileTracingIncludes: {
    // adjust the key to match where your server code runs from:
    // for the App Router, '/' is fine; you can also target specific routes
    '/**/*': ['node_modules/@sparticuz/chromium/bin/**'],
  },
  // If you use Turbopack or standalone output, keep tracing enabled.
  output: 'standalone', // (optional) also works with the includes above
};
 
const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);