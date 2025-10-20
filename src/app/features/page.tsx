'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import Layout from '@/components/Layouts/Layout';
import { featuresData } from '@/lib/datas/featuresData';


export default function FeaturesPage() {

  return (
    <Layout>

      <div className="container mx-auto px-4 py-12">

        {/* Başlık */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            AiSEO <span className="text-cyan-400">Özellikleri</span>
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Yapay zeka aramalarında sitenizin görünürlüğünü analiz etmek ve iyileştirmek için kapsamlı çözümler sunuyoruz.
          </p>
        </motion.div>

        {/* Özellikler */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {featuresData?.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-blue-900/30 backdrop-blur-md rounded-xl p-6 border border-blue-800/30"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white text-xl mb-4">
                {feature?.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature?.title}</h3>
              <p className="text-white/70">{feature?.description}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA bölümü */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 backdrop-blur-md rounded-xl p-8 border border-blue-500/20 text-center max-w-4xl mx-auto"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Sitenizin AI Aramalarındaki Görünürlüğünü Hemen Kontrol Edin
          </h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            Yapay zeka aramalarında kaybolan trafik, potansiyel müşteri ve gelir kaybına neden olur. AiSEO ile görünürlüğünüzü artırın.
          </p>
          <Link href="/">
            <button className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-lg text-white font-medium transition-all">
              Ücretsiz Analiz Başlat
            </button>
          </Link>
        </motion.div>
      </div>

    </Layout>
  );
} 