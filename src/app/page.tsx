import { getMessages } from 'next-intl/server';

import Layout from '@/components/Layouts/Layout';
import Hero from '@/components/Hero';


export async function generateMetadata({
  params: { locale },
} : {
  params: { locale: string };
}) {
  const messages = await getMessages({ locale });
  const title = messages?.TabTitles?.home;
  return {
    title,
  }
}


export default function Home() {

  return (
    <Layout>
      <Hero />
    </Layout>
  );
}
