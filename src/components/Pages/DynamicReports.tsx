'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { FiAlertCircle, FiDownload } from 'react-icons/fi';

import ReportHeader from '@/components/Reports/ReportHeader';
import ReportTabs from '@/components/Reports/ReportTabs';
import Footer from '@/components/Footer';
import { AnalysisJob } from '@/types/geo';

interface Props {
  domain: string;
}

function DynamicReports({ domain }: Readonly<Props>) {

  const l = useTranslations("ResultsPage");
  const locale = useLocale();

  const plainDomain = typeof domain === 'string' ? decodeURIComponent(domain) : '';

  const [jobId, setJobId] = useState<string | null>(null);
  const [report, setReport] = useState<AnalysisJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const res = await fetch(`/api/reports/${encodeURIComponent(plainDomain)}`, { cache: 'no-store' });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Rapor getirilemedi.');
        }
        const data = await res.json();

        if (data.status !== 'COMPLETED' || !data.job) {
          // If someone lands here while the job is still running, bounce them to results page to see progress
          window.location.href = `/results/${encodeURIComponent(plainDomain)}`;
          return;
        }

        setReport(data.job);
        setJobId(data.job.id || data.job._id);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.');
      }
    };
    load();
  }, [plainDomain]);

  return (
    <div className="flex flex-col min-h-screen bg-blue-950 text-white">
      <main className="flex-1 py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {report && report.prometheusReport && report.arkheReport && (
            <motion.div
              className="space-y-6"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            >
              <ReportHeader
                domain={plainDomain}
                analysisDate={new Date(report.createdAt).toLocaleDateString(locale)}
              />

              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                <ReportTabs jobReport={report} />
              </motion.div>

              <motion.div className="text-center" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                <button
                  onClick={() => { if (jobId) window.open(`/api/export-report?jobId=${encodeURIComponent(jobId)}`, '_blank'); }}
                  disabled={!jobId}
                  className="mt-4 md:mt-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 mx-auto"
                >
                  <FiDownload />
                  <span>{l('downloadReport')}</span>
                </button>
              </motion.div>
            </motion.div>
          )}

          {error && (
            <div className="text-red-400 bg-red-950/30 p-4 rounded-lg max-w-6xl mx-auto mt-8">
              <div className="flex items-start">
                <FiAlertCircle className="mt-1 mr-2 flex-shrink-0" />
                <div>{error}</div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default DynamicReports;