'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from "next-intl";

import { FiAlertCircle, FiDownload } from 'react-icons/fi';
// import { useParams } from 'next/navigation';
import ReportHeader from '@/components/Reports/ReportHeader';
import ProgressAnimation from '@/components/ProgressAnimation';
import ReportTabs from '@/components/Reports/ReportTabs';
import Footer from '@/components/Footer';
import { AnalysisJob } from '@/types/geo';
// import { auth } from '@/lib/firebase';
// import { useAuth } from '@/contexts/AuthContext';


interface Props {
    domain: string;
}

const DomainResultsPage = ({ domain }: Props) => {

  const t = useTranslations("HomePage");
  const l = useTranslations("ResultsPage");
    
  const plainDomain = typeof domain === 'string' ? decodeURIComponent(domain) : '';

  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>('QUEUED');
  const [error, setError] = useState<string | null>(null);
  const [geoReport, setGeoReport] = useState<AnalysisJob | null>(null);

  // Build steps with localized labels
  const jobStatusSteps = useMemo(() => ([
    { id: '1', label: t('steps.QUEUED'), status: 'QUEUED' },
    { id: '2', label: t('steps.PROCESSING_SCRAPE'), status: 'PROCESSING_SCRAPE' },
    { id: '3', label: t('steps.PROCESSING_PSI'), status: 'PROCESSING_PSI' },
    { id: '4', label: t('steps.PROCESSING_ARKHE'), status: 'PROCESSING_ARKHE' },
    { id: '5', label: t('steps.PROCESSING_PROMETHEUS'), status: 'PROCESSING_PROMETHEUS' },
    { id: '6', label: t('steps.PROCESSING_LIR'), status: 'PROCESSING_LIR' },
    { id: '7', label: t('steps.PROCESSING_GENERATIVE_PERFORMANCE'), status: 'PROCESSING_GENERATIVE_PERFORMANCE' },
    { id: '8', label: t('steps.COMPLETED'), status: 'COMPLETED' }
  ]), [t]);

  // const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!plainDomain) return;
    // if (isLoading) return;
/* 
    if (!isAuthenticated) {
      window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(`/results/${encodeURIComponent(plainDomain)}`)}`;
      return;
    }
 */
    const startAnalysis = async () => {
      try {
        setError(null);
        setJobStatus('QUEUED');
        // const idToken = await auth.currentUser?.getIdToken?.(true);
        const response = await fetch(`/api/analyze-domain`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {}),
          },
          body: JSON.stringify({ url: plainDomain, 
            // idToken 
          }),
        });

        if (!response.ok) {
          let message = 'Analiz başlatılamadı.';
          try {
            const errorData = await response.json();
            message = (errorData && (errorData.error || errorData.message)) || message;
          } catch {
            try { message = (await response.text()) || message; } catch {}
          }
          throw new Error(message);
        }

        const data = await response.json();
        if (data.mockData) {
          localStorage.setItem('currentAnalysisData', JSON.stringify(data.mockData));
          window.location.href = `/ai-report/${encodeURIComponent(plainDomain)}`;
          return;
        }
        setJobId(data.jobId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu.');
      }
    };

    startAnalysis();
  }, [plainDomain, 
    // isAuthenticated, isLoading
  ]);


  useEffect(() => {
    if (!jobId || jobStatus === 'COMPLETED' || jobStatus === 'FAILED') return;

    const interval = setInterval(async () => {
      try {
        // const idToken = await auth.currentUser?.getIdToken?.(true);
        const response = await fetch(`/api/internal/job-status/${jobId}`, {
          headers: {
            // ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {}),
          },
        });
        if (!response.ok) throw new Error('İş durumu alınamadı.');

        const data = await response.json();
        setJobStatus(data.status);

        if (data.status === 'COMPLETED') {
          clearInterval(interval);
          setGeoReport(data.job);
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
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center">{plainDomain} {l('sections.starting')} </h1>
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
                analysisDate={new Date(geoReport.createdAt).toLocaleDateString('tr-TR')} 
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

              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
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
  )
}

export default DomainResultsPage