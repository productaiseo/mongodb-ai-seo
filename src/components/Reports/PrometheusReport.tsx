'use client';

import React, { useState } from 'react';
import { PrometheusReport as PrometheusReportType, MetricScore } from '@/types/geo';
import { FiChevronDown, FiChevronUp, FiTrendingUp, FiCheckCircle, FiXCircle, FiPlusSquare, FiMinusSquare, FiInfo } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import PillarPerformanceChart from '@/components/Dashboard/PillarPerformanceChart';
import ProgressBar from '@/components/ui/ProgressBar';
import Modal from '@/components/ui/Modal';
import { useTranslations } from 'next-intl';


interface MetricDetailCardProps {
  metricName: string;
  metricData: MetricScore;
}


const MetricDetailCard: React.FC<MetricDetailCardProps> = ({ metricName, metricData }) => {

  const t = useTranslations("ResultsPage");

  const [isSignalsOpen, setIsSignalsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatMetricName = (name: string) => {
    return name.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return { text: 'text-green-400', bg: 'bg-green-500' };
    if (score >= 40) return { text: 'text-yellow-400', bg: 'bg-yellow-500' };
    return { text: 'text-red-400', bg: 'bg-red-500' };
  };

  const scoreColor = getScoreColor(metricData?.score);

  return (
    <div className="text-sm bg-blue-800/10 p-3 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <p className="font-semibold text-white/80">{formatMetricName(metricName)}</p>
        <p className={`font-bold ${scoreColor.text}`}>{metricData?.score}</p>
      </div>
      <ProgressBar score={metricData?.score} colorClass={scoreColor.bg} />
      <p className="text-white/70 mt-2 text-xs">{metricData?.justification}</p>

      <div className="flex items-center gap-4 mt-3">
        {(metricData?.positivePoints || metricData?.negativePoints) && (
          <button onClick={() => setIsSignalsOpen(!isSignalsOpen)} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center">
            {isSignalsOpen ? t('sections.geoPerformance.hideSignals') : t('sections.geoPerformance.showSignals')}
            {isSignalsOpen ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />}
          </button>
        )}
        {metricData.details && (
          <button onClick={() => setIsModalOpen(true)} className="text-xs text-purple-400 hover:text-purple-300 flex items-center">
            <FiInfo className="mr-1" />
            {t('sections.geoPerformance.moreDetails')}
          </button>
        )}
      </div>

      <AnimatePresence>
        {isSignalsOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: '12px' }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            {metricData?.positivePoints && metricData?.positivePoints?.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-bold text-green-400/80 flex items-center"><FiCheckCircle className="mr-1"/>{t('sections.geoPerformance.positiveSignals')}:</p>
                <ul className="list-disc list-inside text-xs text-white/70 pl-2 space-y-1 mt-1">
                  {metricData?.positivePoints?.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}

            {metricData?.negativePoints && metricData?.negativePoints.length > 0 && (
              <div>
                <p className="text-xs font-bold text-red-400/80 flex items-center"><FiXCircle className="mr-1"/>{t('sections.geoPerformance.negativeSignals')}:</p>
                <ul className="list-disc list-inside text-xs text-white/70 pl-2 space-y-1 mt-1">
                  {metricData?.negativePoints?.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formatMetricName(metricName)}>
        <p className="text-sm text-white/80">{metricData?.details}</p>
      </Modal>
    </div>
  );
};

interface PillarCardProps {
  pillarName: string;
  pillarData: {
    score: number;
    weight: number;
    metrics: Record<string, MetricScore>;
  };
  isOpen: boolean;
  onToggle: () => void;
}


const PillarCard: React.FC<PillarCardProps> = ({ pillarName, pillarData, isOpen, onToggle }) => {

  const t = useTranslations("ResultsPage");

  if (!pillarData) return null;

  const pillarTranslations: { [key: string]: string } = {
    performance: t('sections.geoPerformance.sections.pageSpeed.title'),
    contentStructure: t('sections.geoPerformance.sections.contentStructure.title'),
    eeatSignals: t('sections.geoPerformance.sections.eeatSignals.title'),
    technicalGEO: t('sections.geoPerformance.sections.technicalGeo.title'),
    structuredData: t('sections.geoPerformance.sections.structuredData.title'),
    brandAuthority: t('sections.geoPerformance.sections.brandAuthority.title'),
    entityOptimization: t('sections.geoPerformance.sections.assetOptimization.title'),
    contentStrategy: t('sections.geoPerformance.sections.contentStrategy.title'),
  };

  const metricTranslations: { [key: string]: string } = {
    headings: t('sections.geoPerformance.sections.metricTranslations.headings'),
    paragraphs: t('sections.geoPerformance.sections.metricTranslations.paragraphs'),
    metaTags: t('sections.geoPerformance.sections.metricTranslations.metaTags'),
    imageAlts: t('sections.geoPerformance.sections.metricTranslations.imageAlts'),
    schemaOrg: t('sections.geoPerformance.sections.metricTranslations.schemaOrg'),
    backlinks: t('sections.geoPerformance.sections.metricTranslations.backlinks'),
    brandMentions: t('sections.geoPerformance.sections.metricTranslations.brandMentions'),
    experience: t('sections.geoPerformance.sections.metricTranslations.experience'),
    expertise: t('sections.geoPerformance.sections.metricTranslations.expertise'),
    authoritativeness: t('sections.geoPerformance.sections.metricTranslations.authoritativeness'),
    trustworthiness: t('sections.geoPerformance.sections.metricTranslations.trustworthiness'),
    entityCompleteness: t('sections.geoPerformance.sections.metricTranslations.entityCompleteness'),
    knowledgeGraphPresence: t('sections.geoPerformance.sections.metricTranslations.knowledgeGraphPresence'),
    entityReconciliation: t('sections.geoPerformance.sections.metricTranslations.entityReconciliation'),
    relationshipAnalysis: t('sections.geoPerformance.sections.metricTranslations.relationshipAnalysis'),
    conversationalReadinessScore: t('sections.geoPerformance.sections.metricTranslations.conversationalReadinessScore'),
    informationGainScore: t('sections.geoPerformance.sections.metricTranslations.informationGainScore'),
    geoTopicGapAnalysis: t('sections.geoPerformance.sections.metricTranslations.geoTopicGapAnalysis'),
    multimodalOptimization: 'Çoklu Model Optimizasyonu',
  };

  const getScoreColor = (score: number | null | undefined) => {
    if (score === null || score === undefined) return 'text-gray-400';
    if (score >= 70) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const score = pillarData?.score;
  const scoreDisplay = score !== null && score !== undefined ? score.toFixed(1) : 'N/A';

  return (
    <div className="bg-blue-900/30 rounded-lg border border-blue-800/30 overflow-hidden">
      <button
        className="w-full flex justify-between items-center p-4 text-left"
        onClick={onToggle}
      >
        <h4 className="font-bold text-lg text-white">{pillarTranslations[pillarName] || pillarName}</h4>
        <div className="flex items-center gap-4">
          <span className={`font-bold text-xl ${getScoreColor(score)}`}>{scoreDisplay}</span>
          {isOpen ? <FiChevronUp /> : <FiChevronDown />}
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4"
          >
            <div className="border-t border-blue-800/50 pt-4 space-y-4">
              {Object.entries(pillarData.metrics).map(([key, metric]) => (
                <MetricDetailCard key={key} metricName={metricTranslations[key] || key.replace(/([A-Z])/g, ' $1')} metricData={metric} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


interface PrometheusReportProps {
  report: PrometheusReportType;
}

const PrometheusReport: React.FC<PrometheusReportProps> = ({ report }) => {

  const t = useTranslations("ResultsPage");
  if (!report) return null;

  const pillarKeys = Object.keys(report.pillars);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [openStates, setOpenStates] = useState(
    pillarKeys.reduce((acc, key) => ({ ...acc, [key]: false }), {} as Record<string, boolean>)
  );

  const allAreOpen = Object.values(openStates).every(Boolean);

  const handleToggleAll = () => {
    const newStates = pillarKeys.reduce((acc, key) => ({ ...acc, [key]: !allAreOpen }), {});
    setOpenStates(newStates);
  };

  const handleTogglePillar = (pillarName: string) => {
    setOpenStates(prev => ({ ...prev, [pillarName]: !prev[pillarName] }));
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="flex items-center text-xl font-bold text-white">
            <FiTrendingUp className="mr-2 text-cyan-400" />
            <span>{t('sections.geoPerformance.subTitle')}</span>
          </h3>
          <button
            onClick={handleToggleAll}
            className="flex items-center gap-2 text-xs bg-blue-800/50 hover:bg-blue-800/80 text-white/80 font-semibold py-1 px-3 rounded-lg transition-colors"
          >
            {allAreOpen ? <FiMinusSquare/> : <FiPlusSquare/>}
            <span>{allAreOpen ? t('sections.geoPerformance.toggleView') : t('sections.geoPerformance.expandView')}</span>
          </button>
        </div>

        <PillarPerformanceChart pillars={report.pillars} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {Object.entries(report?.pillars)?.map(([key, value]) => (
            <PillarCard
              key={key}
              pillarName={key}
              pillarData={value}
              isOpen={openStates[key]}
              onToggle={() => handleTogglePillar(key)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrometheusReport;
