import {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
 
const nextConfig: NextConfig = {
    compiler: {
    // Remove console logs only in production, excluding error logs
    removeConsole: process.env.NODE_ENV === "production" ? { 
        exclude: ["error", "warn", "info", "log"] 
    } : false
  }
};
 
const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);