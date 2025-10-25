'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from "next-intl";
import { FiAlertCircle, FiDownload } from 'react-icons/fi';

import ReportHeader from '@/components/Reports/ReportHeader';
import ProgressAnimation from '@/components/ProgressAnimation';
import ReportTabs from '@/components/Reports/ReportTabs';
import Footer from '@/components/Footer';
import { AnalysisJob } from '@/types/geo';

interface Props {
  plainDomain: string;
}

const DomainResultsPage = ({ plainDomain }: Props) => {

  const t = useTranslations("HomePage");
  const l = useTranslations("ResultsPage");
  const locale = useLocale();
  const router = useRouter();

  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>('QUEUED');
  const [error, setError] = useState<string | null>(null);
  const [geoReport, setGeoReport] = useState<AnalysisJob | null>(null);

  // Build steps with localized labels
  const jobStatusSteps = useMemo(() => ([
    { id: '1', label: t('steps.QUEUED'), status: 'QUEUED' },
    { id: '2', label: t('steps.PROCESSING_SCRAPE'), status: 'PROCESSING_SCRAPE' },
    { id: '3', label: t('steps.PROCESSING_ARKHE'), status: 'PROCESSING_ARKHE' },
    { id: '4', label: t('steps.PROCESSING_PSI'), status: 'PROCESSING_PSI' },
    { id: '5', label: t('steps.PROCESSING_PROMETHEUS'), status: 'PROCESSING_PROMETHEUS' },
    { id: '6', label: t('steps.PROCESSING_GENERATIVE_PERFORMANCE'), status: 'PROCESSING_GENERATIVE_PERFORMANCE' },
    { id: '7', label: t('steps.PROCESSING_LIR'), status: 'PROCESSING_LIR' },
    { id: '8', label: t('steps.COMPLETED'), status: 'COMPLETED' }
  ]), [t]);

  // 1) PRE-CHECK: see if a report already exists
  useEffect(() => {
    if (!plainDomain) return;

    const precheck = async () => {
      try {
        setError(null);

        const res = await fetch(`/api/reports/${encodeURIComponent(plainDomain)}`, { cache: 'no-store' });

        if (res.status === 404) {
          // no report; start fresh
          await startAnalysis();
          return;
        }

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Ön kontrol yapılamadı.');
        }

        const data = await res.json();

        if (data.status === 'COMPLETED' && data.job) {
          // redirect to the canonical report page
          router.replace(`/report/${encodeURIComponent(plainDomain)}`);
          return;
        }

        // If there is a running job, resume polling
        if (data.status && data.jobId) {
          setJobId(data.jobId);
          setJobStatus(data.status);
          return;
        }

        // Otherwise, start a new analysis
        await startAnalysis();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu.');
      }
    };

    const startAnalysis = async () => {
      setJobStatus('QUEUED');
      const response = await fetch(`/api/analyze-domain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: plainDomain, locale }),
      });

      if (!response.ok) {
        let message = 'Analiz başlatılamadı.';
        try {
          const errorData = await response.json();
          message = (errorData?.error || errorData?.message) || message;
        } catch {
          try { message = (await response.text()) || message; } catch {}
        }
        throw new Error(message);
      }

      const data = await response.json();
      if (data.mockData) {
        localStorage.setItem('currentAnalysisData', JSON.stringify(data.mockData));
        router.replace(`/ai-report/${encodeURIComponent(plainDomain)}`);
        return;
      }
      setJobId(data.jobId);
    };

    precheck();
  }, [plainDomain, locale, router]);

  // 2) Poll job status (unchanged)
  useEffect(() => {
    if (!jobId || jobStatus === 'COMPLETED' || jobStatus === 'FAILED') return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/internal/job-status/${jobId}`);
        if (!response.ok) throw new Error('İş durumu alınamadı.');

        const data = await response.json();
        setJobStatus(data.status);

        if (data.status === 'COMPLETED') {
          clearInterval(interval);
          setGeoReport(data.job);
          // Optional: also push to /report page on completion to unify URL
          // router.replace(`/report/${encodeURIComponent(plainDomain)}`);
        } else if (data.status === 'FAILED') {
          clearInterval(interval);
          setError(data.error || 'Analiz sırasında bir hata oluştu.');
        }
      } catch (err) {
        clearInterval(interval);
        setError(err instanceof Error ? err.message : 'Durum kontrolü sırasında hata.');
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [jobId, jobStatus]);


  const getCurrentStep = () => {
    const currentStepIndex = jobStatusSteps.findIndex(step => step.status === jobStatus);
    return jobStatusSteps.map((step, index) => ({
      ...step,
      completed: index < currentStepIndex,
      current: index === currentStepIndex,
    }));
  };

  const progress = jobStatus === 'COMPLETED'
    ? 100
    : Math.floor((jobStatusSteps.findIndex(s => s.status === jobStatus) / (jobStatusSteps.length - 1)) * 100) || 0;

  return (
    <div className="flex flex-col min-h-screen bg-blue-950 text-white">
      <main className="flex-1 py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {jobStatus !== 'COMPLETED' && !error && (
            <motion.div
              className="max-w-3xl mx-auto my-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center">
                {plainDomain} {l('sections.starting')}
              </h1>
              <ProgressAnimation steps={getCurrentStep()} progress={progress} />
            </motion.div>
          )}

          {geoReport && jobStatus === 'COMPLETED' && geoReport.prometheusReport && geoReport.arkheReport && (
            <motion.div
              className="space-y-6"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            >
              <ReportHeader
                domain={plainDomain}
                analysisDate={new Date(geoReport.createdAt).toLocaleDateString(locale)}
              />

              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                <ReportTabs jobReport={geoReport} />
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
};

export default DomainResultsPage;
