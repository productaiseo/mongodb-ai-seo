// import { redirect, notFound } from "next/navigation";
import { type Metadata } from 'next';
import DynamicResults from '@/components/Pages/DynamicResults';


// Force dynamic rendering - prevents caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// Generate metadata dynamically based on the page parameter
export async function generateMetadata(
  props: {
    params: Promise<{ domain: string }>;
  }
): Promise<Metadata> {

  const params = await props.params;
  // Extract the domain parameter from the params
  const { domain } = params;
  
  return {
    metadataBase: new URL(`${process.env.NEXT_PUBLIC_URL}`),
    title: domain,
    description: "This is a dynamically generated description.",
  };
}


export default async function DynamicPage(
  props: Readonly<{
    params: Promise<{ domain: string }>;
  }>
) {
  const params = await props.params;
  // Extract the domain parameter from the params
  const { domain } = params;

  // Use timestamp to force fresh render
  const timestamp = Date.now();

  const plainDomain = typeof domain === 'string' ? decodeURIComponent(domain) : '';

  return (
    <DynamicResults 
      key={`${plainDomain}-${timestamp}`}
      plainDomain={plainDomain}
    />
  );
}