'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import Layout from '@/components/Layouts/Layout';
import { stepsData } from '@/lib/datas/stepsData';
import { benefitsData } from '@/lib/datas/benefitsData';


export default function AboutPage() {

  return (
    <Layout>

      {/* Ana içerik */}
      <div className="container mx-auto px-4 py-12">

        {/* Başlık */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            AiSEO <span className="text-cyan-400">Nasıl Çalışır?</span>
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Sitenizin yapay zeka aramalarındaki görünürlüğünü analiz etmek ve iyileştirmek için kullandığımız süreci keşfedin.
          </p>
        </motion.div>

        {/* Adımlar */}
        <div className="max-w-5xl mx-auto mb-20">
          {stepsData?.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-16 relative"
            >
              {/* Adım numarası ve ikon */}
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-2xl flex-shrink-0 relative z-10">
                {step?.icon}
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {step?.id}
                </div>
              </div>
              
              {/* Adım içeriği */}
              <div className="flex-grow md:pt-2">
                <h3 className="text-2xl font-semibold mb-3">{step?.title}</h3>
                <p className="text-white/70 text-lg">{step?.description}</p>
              </div>
              
              {/* Bağlantı çizgisi (son adım hariç) */}
              {index < stepsData?.length - 1 && (
                <div className="absolute top-16 left-8 w-0.5 h-28 bg-gradient-to-b from-cyan-500 to-transparent hidden md:block"></div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Neden Kullanmalısınız */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="max-w-5xl mx-auto mb-16"
        >
          <h2 className="text-3xl font-bold mb-10 text-center">
            Neden <span className="text-cyan-400">AiSEO</span> Kullanmalısınız?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefitsData?.map((benefit, index) => (
              <div key={index} className="bg-blue-900/30 backdrop-blur-md rounded-xl p-6 border border-blue-800/30">
                <h3 className="text-xl font-semibold mb-3">{benefit?.title}</h3>
                <p className="text-white/70">{benefit?.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA bölümü */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 backdrop-blur-md rounded-xl p-8 border border-blue-500/20 text-center max-w-4xl mx-auto"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Sitenizi Şimdi Analiz Edin
          </h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            Ücretsiz analiz ile web sitenizin AI aramalarındaki görünürlüğünü öğrenin ve kişiselleştirilmiş öneriler alın.
          </p>
          <Link href="/">
            <button className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-lg text-white font-medium transition-all flex items-center mx-auto">
              <span>Ücretsiz Analiz Başlat</span>
              <FiArrowRight className="ml-2" />
            </button>
          </Link>
        </motion.div>
      </div>

    </Layout>
  );
} 