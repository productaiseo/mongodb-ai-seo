// import { redirect, notFound } from "next/navigation";
import { type Metadata } from 'next';
import Layout from '@/components/Layouts/Layout';
import DynamicReports from '@/components/Pages/DynamicReports';

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


export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DynamicPage(
  props: Readonly<{
    params: Promise<{ domain: string }>;
  }>
) {
  const params = await props.params;
  // Extract the domain parameter from the params
  const { domain } = params;

  return (
    <Layout>
      <DynamicReports
        key={domain}
        domain={domain}
      />
    </Layout>
  );
}
