'use client';

import React from 'react';
import { ArkheReport as ArkheReportType } from '@/types/geo';
import InteractiveDataTable from '@/components/ui/InteractiveDataTable';
import MetricCard from '@/components/ui/MetricCard';
import { FiBriefcase, FiUsers, FiBarChart, FiFileText, FiTrendingUp } from 'react-icons/fi';
import { useTranslations } from 'next-intl';


interface ArkheReportProps {
  report: ArkheReportType;
}


const ArkheReport: React.FC<ArkheReportProps> = ({ report }) => {
  const t = useTranslations("ResultsPage");
  if (!report) return null;

  const businessCompetitorsColumns = [
    { key: 'name', header: t('sections.marketAnalysis.sections.businessCompetitors.columnTitleBusiness') },
    { key: 'reason', header: t('sections.marketAnalysis.sections.businessCompetitors.columnTitleReason') },
  ];

  const contentCompetitorsColumns = [
    { key: 'topic', header: t('sections.marketAnalysis.sections.contentCompetitors.columnTitleTopic') },
    { key: 'reason', header: t('sections.marketAnalysis.sections.contentCompetitors.columnTitleReason') },
  ];

  const businessCompetitorsData = report.competitors.businessCompetitors.map(c => ({
    ...c,
    name: <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">{c.name}</a>
  }));
  
  const contentCompetitorsData = report.competitors.contentCompetitors.map(c => ({
    ...c,
    topic: <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">{c.topic}</a>
  }));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-900/30 rounded-lg border border-blue-800/30 p-4 h-full flex flex-col">
          <div className="flex items-center text-lg font-bold text-white mb-3">
            <FiBriefcase className="mr-2 text-cyan-400" />
            <span>{t('sections.marketAnalysis.sections.businessModel.title')}</span>
          </div>
          <MetricCard
            title={t('sections.marketAnalysis.sections.businessModel.subTitle')}
            value={report.businessModel.modelType}
            description={report.businessModel.justification}
          />
          {report.businessModel.keyRevenueStreams && report.businessModel.keyRevenueStreams.length > 0 && (
            <div className="mt-4 pt-4 border-t border-blue-800/50">
              <h5 className="text-sm font-semibold text-white/80 mb-2">{t('sections.marketAnalysis.sections.businessModel.subContentTitle')}</h5>
              <ul className="list-disc list-inside text-xs text-white/70 space-y-1">
                {report.businessModel.keyRevenueStreams.map((stream, index) => (
                  <li key={index}>{stream}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="bg-blue-900/30 rounded-lg border border-blue-800/30 p-4 h-full flex flex-col">
          <div className="flex items-center text-lg font-bold text-white mb-3">
            <FiUsers className="mr-2 text-cyan-400" />
            <span>{t('sections.marketAnalysis.sections.targetGroups.title')}</span>
          </div>
          <MetricCard
            title={t('sections.marketAnalysis.sections.targetGroups.subTitle')}
            value={report.targetAudience.primaryAudience.demographics}
            description={report.targetAudience.primaryAudience.psychographics}
          />
          {report.targetAudience.secondaryAudiences && report.targetAudience.secondaryAudiences.length > 0 && (
            <div className="mt-4 pt-4 border-t border-blue-800/50">
              <h5 className="text-sm font-semibold text-white/80 mb-2">{t('sections.marketAnalysis.sections.targetGroups.subContentTitle')}</h5>
              <ul className="list-disc list-inside text-xs text-white/70 space-y-1">
                {report.targetAudience.secondaryAudiences.map((audience, index) => (
                  <li key={index}>{audience}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <div>
        <h3 className="flex items-center text-xl font-bold text-white mb-4">
          <FiBarChart className="mr-2 text-cyan-400" />
          <span>{t('sections.marketAnalysis.sections.businessCompetitors.title')}</span>
        </h3>
        <InteractiveDataTable columns={businessCompetitorsColumns} data={businessCompetitorsData} />
      </div>
      <div>
        <h3 className="flex items-center text-xl font-bold text-white mb-4">
          <FiFileText className="mr-2 text-cyan-400" />
          <span>{t('sections.marketAnalysis.sections.contentCompetitors.title')}</span>
        </h3>
        <InteractiveDataTable columns={contentCompetitorsColumns} data={contentCompetitorsData} />
      </div>
      <div>
        <h3 className="flex items-center text-xl font-bold text-white mb-2">
          <FiTrendingUp className="mr-2 text-cyan-400" />
          <span>{t('sections.marketAnalysis.sections.competitionSummary.title')}</span>
        </h3>
        <p className="text-white/80 bg-blue-900/30 p-4 rounded-lg border border-blue-800/30">{report?.competitors?.summary}</p>
      </div>
    </div>
  );
};

export default ArkheReport;
