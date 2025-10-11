/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState } from 'react';
import { useTranslations } from "next-intl";
import { FiTrendingUp, FiLayout, FiBarChart2, FiFileText, FiZap, FiShield } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import PrometheusReportComponent from '@/components/Reports/PrometheusReport';
import ArkheReportComponent from '@/components/Reports/ArkheReport';
import DelfiAgendaComponent from '@/components/Reports/DelfiAgenda';
// import StrategicImpactReportComponent from '@/components/Reports/StrategicImpactReport';
import GenerativePerformanceReport from '@/components/Reports/GenerativePerformanceReport';
import EnhancedGeoScoreOverview from '@/components/Dashboard/EnhancedGeoScoreOverview';
import ImpactfulActionPlan from '@/components/Dashboard/ImpactfulActionPlan';
import { AnalysisJob } from '@/types/geo';
import CompetitorComparisonChart from '@/components/Dashboard/CompetitorComparisonChart';


type Tab = 'overview' | 'prometheus' | 'arkhe' | 'delfi' | 'strategic' | 'generative';

interface ReportTabsProps {
  jobReport: AnalysisJob;
}


const ReportTabs: React.FC<ReportTabsProps> = ({ jobReport }) => {

  const t = useTranslations("ResultsPage");
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const {
    prometheusReport,
    arkheReport,
    delfiAgenda,
    // strategicImpactForecast,
    generativePerformanceReport,
  } = jobReport;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: t('sections.overview.tabTitle'), icon: <FiLayout /> },
    { id: 'prometheus', label: t('sections.geoPerformance.tabTitle'), icon: <FiBarChart2 /> },
    { id: 'arkhe', label: t('sections.marketAnalysis.tabTitle'), icon: <FiShield /> },
    { id: 'delfi', label: t('sections.strategicGrowth.tabTitle'), icon: <FiFileText /> },
    // { id: 'strategic', label: t('sections.strategicImpact.tabTitle'), icon: <FiTrendingUp /> },
    { id: 'generative', label: t('sections.generativePerformance.tabTitle'), icon: <FiZap /> },
  ];

  const renderContent = () => {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && prometheusReport ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EnhancedGeoScoreOverview
                score={prometheusReport.overallGeoScore}
                interpretation={prometheusReport.scoreInterpretation}
                executiveSummary={prometheusReport.executiveSummary}
                geoScoreDetails={prometheusReport.geoScoreDetails}
              />
              <ImpactfulActionPlan actionPlan={prometheusReport.actionPlan} />
            </div>
          ) : activeTab === 'overview' && !prometheusReport ? (
            <div>{t('sections.overview.loadingError')}</div>
          ) : null}

          {activeTab === 'prometheus' && prometheusReport ? (
            <PrometheusReportComponent report={prometheusReport} />
          ) : activeTab === 'prometheus' && !prometheusReport ? (
            <div>{t('sections.geoPerformance.loadingError')}</div>
          ) : null}

          {activeTab === 'arkhe' && arkheReport && prometheusReport ? (
            <div>
              <ArkheReportComponent report={arkheReport} />
              <div className="mt-6">
                <h3 className="text-xl font-bold mb-4">Rakip Karşılaştırması</h3>
                <CompetitorComparisonChart
                  competitors={arkheReport.competitors.businessCompetitors}
                  mainDomainScore={prometheusReport.overallGeoScore}
                  mainDomainName={jobReport.url ? jobReport.url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0] : 'Analiz Edilen Site'}
                />
              </div>
            </div>
          ) : activeTab === 'arkhe' && (!arkheReport || !prometheusReport) ? (
            <div>{t('sections.marketAnalysis.loadingError')}</div>
          ) : null}

          {activeTab === 'delfi' && delfiAgenda ? (
            <DelfiAgendaComponent report={delfiAgenda} />
          ) : activeTab === 'delfi' && !delfiAgenda ? (
            <div>{t('sections.strategicGrowth.loadingError')}</div>
          ) : null}

{/*
          {activeTab === 'strategic' && strategicImpactForecast ? (
            <StrategicImpactReportComponent report={strategicImpactForecast} />
          ) : activeTab === 'strategic' && !strategicImpactForecast ? (
            <div>{t('sections.strategicImpact.loadingError')}</div>
          ) : null}
*/}
          {activeTab === 'generative' && generativePerformanceReport ? (
            <GenerativePerformanceReport report={generativePerformanceReport} />
          ) : activeTab === 'generative' && !generativePerformanceReport ? (
            <div>{t('sections.generativePerformance.loadingError')}</div>
          ) : null}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="w-full bg-blue-900/20 rounded-lg border border-blue-800/30 p-6">
      <div className="border-b border-blue-700/50">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {tabs?.map((tab) => (
            <button
              key={tab?.id}
              onClick={() => setActiveTab(tab?.id)}
              className={`${
                activeTab === tab?.id
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-white/60 hover:text-white hover:border-blue-600/80'
              } flex items-center whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none`}
            >
              {tab?.icon}
              <span className="ml-2">{tab?.label}</span>
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default ReportTabs;
