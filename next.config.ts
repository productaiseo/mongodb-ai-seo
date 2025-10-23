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
  serverExternalPackages: ['@sparticuz/chromium', 'playwright-core'],

  // explicitly include chromium's brotli assets in the output
  outputFileTracingIncludes: {
    '/**/*': ['node_modules/@sparticuz/chromium/bin/**'],
  },

  // output: 'standalone', (optional)
};
 
const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);