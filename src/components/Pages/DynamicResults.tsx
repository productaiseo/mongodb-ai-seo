'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from "next-intl";
import { FiAlertCircle, FiDownload } from 'react-icons/fi';

import ReportHeader from '@/components/Reports/ReportHeader';
import ProgressAnimation from '@/components/ProgressAnimation';
import ReportTabs from '@/components/Reports/ReportTabs';
import { AnalysisJob } from '@/types/geo';

/*
interface Props {
  plainDomain: string;
}
*/

const DomainResultsPage = (
  // { plainDomain }: Props
) => {

  const t = useTranslations("HomePage");
  const l = useTranslations("ResultsPage");
  const locale = useLocale();
  const router = useRouter();
  const { domain }: any = useParams();

  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>('PROCESSING_SCRAPE');
  const [error, setError] = useState<string | null>(null);
  const [geoReport, setGeoReport] = useState<AnalysisJob | null>(null);

  const retryCountRef = useRef(0);
  const maxRetries = 3;

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

  // const params = useParams<{ domain: string }>();
  console.log('DomainResultsPage params:', domain);
  const plainDomain = typeof domain === 'string' ? decodeURIComponent(domain) : '';

  // 1) PRE-CHECK: see if a report already exists
  useEffect(() => {
    if (!plainDomain) return;

    const precheck = async () => {
      try {
        setError(null);
        retryCountRef.current = 0;

        const apiReportsUrl = `${process.env.NEXT_PUBLIC_API_URL}/reports/${encodeURIComponent(plainDomain)}`;
        console.log('[precheck] apiReportsUrl:', apiReportsUrl);
        const res = await fetch(apiReportsUrl, { 
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          }
        });

        if (res.status === 404) {
          // no report; start fresh
          console.log('[precheck] No existing report found, starting new analysis');
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
          console.log('[precheck] Found completed report, redirecting');
          router.replace(`/report/${encodeURIComponent(plainDomain)}`);
          return;
        }

        // If there is a running job, resume polling
        if (data.status && data.jobId) {
          console.log('[precheck] Found running job, resuming polling:', data.jobId);
          setJobId(data.jobId);
          setJobStatus(data.status);
          return;
        }

        // Otherwise, start a new analysis
        console.log('[precheck] No valid job found, starting new analysis');
        await startAnalysis();
      } catch (err) {
        console.error('[precheck] Error:', err);
        setError(err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu.');
      }
    };

    const startAnalysis = async () => {
      try {
        console.log('[startAnalysis] Starting analysis for:', plainDomain);
        setJobStatus('PROCESSING_SCRAPE');

        const apiAnalysisUrl = `${process.env.NEXT_PUBLIC_API_URL}/internal/start-analysis`;
        const response = await fetch(apiAnalysisUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
          cache: 'no-store',
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
        console.log('[startAnalysis] Response:', data);

        if (!data.jobId) {
          throw new Error('No jobId returned from start-analysis API');
        }

        console.log('[startAnalysis] Job created with ID:', data.jobId);
        setJobId(data.jobId);
      } catch (err) {
        console.error('[startAnalysis] Error:', err);
        throw err;
      }
    };

    precheck();
  }, [plainDomain, locale, router]);

  // 2) Poll job status with retry logic
  useEffect(() => {
    if (!jobId || jobStatus === 'COMPLETED' || jobStatus === 'FAILED') return;

    console.log('[polling] Starting poll for jobId:', jobId);

    const interval = setInterval(async () => {
      try {
        const apiJobStatusUrl = `${process.env.NEXT_PUBLIC_API_URL}/internal/job-status/${jobId}`;
        const response = await fetch(apiJobStatusUrl, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          }
        });

        if (response.status === 404) {
          // Job not found - might be a race condition, retry a few times
          if (retryCountRef.current < maxRetries) {
            retryCountRef.current++;
            console.warn(`[polling] Job not found, retry ${retryCountRef.current}/${maxRetries}`);
            return; // Keep polling
          } else {
            clearInterval(interval);
            setError('İş bulunamadı. Lütfen sayfayı yenileyin veya yeni bir analiz başlatın.');
            return;
          }
        }

        if (!response.ok) {
          throw new Error('İş durumu alınamadı.');
        }

        const data = await response.json();
        console.log('[polling] Job status:', data.status);

        // Reset retry count on successful fetch
        retryCountRef.current = 0;
        
        setJobStatus(data.status);

        if (data.status === 'COMPLETED') {
          clearInterval(interval);
          setGeoReport(data.job);
          console.log('[polling] Job completed successfully');
        } else if (data.status === 'FAILED') {
          clearInterval(interval);
          setError(data.error || 'Analiz sırasında bir hata oluştu.');
          console.error('[polling] Job failed:', data.error);
        }
      } catch (err) {
        console.error('[polling] Error:', err);
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          console.warn(`[polling] Error, retry ${retryCountRef.current}/${maxRetries}`);
        } else {
          clearInterval(interval);
          setError(err instanceof Error ? err.message : 'Durum kontrolü sırasında hata.');
        }
      }
    }, 5000);

    return () => {
      console.log('[polling] Cleanup interval');
      clearInterval(interval);
    };
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
      <main className="container flex-1 mx-auto py-8">
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
      </main>
  );
};

export default DomainResultsPage;
