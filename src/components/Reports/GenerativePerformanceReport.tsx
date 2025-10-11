'use client';

import React from 'react';
import Link from 'next/link';
import { GenerativePerformanceReport as GenerativePerformanceReportType } from '@/types/geo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FiShare2, FiLink, FiSmile, FiAlertTriangle } from 'react-icons/fi';
import { useTranslations } from 'next-intl';

interface GenerativePerformanceReportProps {
  report: GenerativePerformanceReportType;
}

const MetricCard = ({ title, icon, value, unit, children }: { title: string, icon: React.ReactNode, value: string | number, unit?: string, children?: React.ReactNode }) => (
  <Card className="bg-blue-900/30 border border-blue-800/20">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-white/80">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-white">
        {value}{unit && <span className="text-xs text-white/60 ml-1">{unit}</span>}
      </div>
      {children}
    </CardContent>
  </Card>
);

const GenerativePerformanceReport: React.FC<GenerativePerformanceReportProps> = ({ report }) => {

  const t = useTranslations("ResultsPage");

  if (!report) {
    return <p>{t('sections.generativePerformance.notAvailable')}</p>;
  }

  const { shareOfGenerativeVoice, citationAnalysis, sentimentAnalysis, accuracyAndHallucination } = report;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-cyan-400">{t('sections.generativePerformance.subTitle')}</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title={t('sections.generativePerformance.sections.productiveShare.title')} icon={<FiShare2 className="h-4 w-4 text-white/60" />} value={shareOfGenerativeVoice.score.toFixed(1)} unit="%">
          <p className="text-xs text-white/60">{t('sections.generativePerformance.sections.productiveShare.description')}</p>
        </MetricCard>
        <MetricCard title={t('sections.generativePerformance.sections.citationRate.title')} icon={<FiLink className="h-4 w-4 text-white/60" />} value={citationAnalysis.citationRate.toFixed(1)} unit="%">
           <p className="text-xs text-white/60">
           {citationAnalysis.citations} 
            {t('sections.generativePerformance.sections.citationRate.description')}
           </p>
        </MetricCard>
        <MetricCard title={t('sections.generativePerformance.sections.positiveEmotion.title')} icon={<FiSmile className="h-4 w-4 text-white/60" />} value={sentimentAnalysis.positive.toFixed(1)} unit="%">
          <p className="text-xs text-white/60">
           {t('sections.generativePerformance.sections.positiveEmotion.description')}: {sentimentAnalysis.sentimentTrend}
          </p>
        </MetricCard>
        <MetricCard title={t('sections.generativePerformance.sections.accuracyScore.title')} icon={<FiAlertTriangle className="h-4 w-4 text-white/60" />} value={accuracyAndHallucination.accuracyScore.toFixed(1)} unit="%">
           <p className="text-xs text-white/60">
            {t('sections.generativePerformance.sections.accuracyScore.description')}
           </p>
        </MetricCard>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-blue-900/30 border border-blue-800/20">
          <CardHeader>
            <CardTitle className="text-lg text-white">
              {t('sections.generativePerformance.sections.quoteDetails.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {citationAnalysis?.topCitedUrls?.length > 0 ? (
              <ul className="space-y-2">
                {citationAnalysis?.topCitedUrls?.map((url, index) => (
                  <li key={index} className="text-sm text-cyan-400 truncate">
                    <Link href={url} target="_blank" rel="noopener noreferrer">
                      {url}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-white/60">
                {t('sections.generativePerformance.sections.quoteDetails.noQuotes')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-blue-900/30 border border-blue-800/20">
          <CardHeader>
            <CardTitle className="text-lg text-white">
              {t('sections.generativePerformance.sections.accuracyAndHallucination.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {accuracyAndHallucination?.examples?.length > 0 ? (
              <ul className="space-y-4">
                {accuracyAndHallucination?.examples?.slice(0, 3).map((example, index) => (
                  <li key={index} className="text-sm border-b border-blue-800/30 pb-2">
                    <p className="font-semibold text-white/90">
                    {t('sections.generativePerformance.sections.accuracyAndHallucination.claim')}: 
                    &quot;{example?.claim}&quot;</p>
                    <p className={`text-xs mt-1 ${
                      example?.verificationResult === 'verified' ? 'text-green-400' :
                      example?.verificationResult === 'contradictory' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {t('sections.generativePerformance.sections.accuracyAndHallucination.status')}: 
                      {example?.verificationResult}
                    </p>
                    <p className="text-xs text-white/70 mt-1">
                      {t('sections.generativePerformance.sections.accuracyAndHallucination.explanation')}: 
                      {example?.explanation}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-white/60">
                {t('sections.generativePerformance.sections.accuracyAndHallucination.noAnalysis')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GenerativePerformanceReport;
