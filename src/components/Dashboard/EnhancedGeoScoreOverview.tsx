import { useTranslations } from "next-intl";
import { motion } from 'framer-motion';
import { FiTrendingUp, FiAlertTriangle, FiAward,
  // FiUsers, FiBarChart2, 
 } from 'react-icons/fi';
import MetricCard from '@/components/ui/MetricCard';
import { GeoScore } from '@/types/geo';
import Link from 'next/link';


interface EnhancedGeoScoreOverviewProps {
  score: number;
  interpretation: string;
  executiveSummary: string;
  geoScoreDetails?: GeoScore;
}


const Gauge: React.FC<{ score: number }> = ({ score }) => {

  const t = useTranslations("ResultsPage");

  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  let colorClass = 'text-red-400';
  if (score >= 40) colorClass = 'text-yellow-400';
  if (score >= 70) colorClass = 'text-green-400';

  return (
    <div className="relative w-56 h-56">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle
          className="text-blue-800/50"
          strokeWidth="10"
          stroke="currentColor"
          fill="transparent"
          r="45"
          cx="50"
          cy="50"
        />
        <motion.circle
          className={colorClass}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r="45"
          cx="50"
          cy="50"
          transform="rotate(-90 50 50)"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold">{score}</span>
        <span className="text-sm text-white/70">{t('sections.overview.geoScore')}</span>
      </div>
    </div>
  );
};

const EnhancedGeoScoreOverview: React.FC<EnhancedGeoScoreOverviewProps> = ({
  score,
  interpretation,
  executiveSummary,
  geoScoreDetails,
}) => {

  const t = useTranslations("ResultsPage");

  const interpretationIcons: { [key: string]: React.ReactNode } = {
    'Zayıf': <FiAlertTriangle className="mr-2" />,
    'Weak': <FiAlertTriangle className="mr-2" />,
    'Gelişmekte': <FiTrendingUp className="mr-2" />,
    'Developing': <FiTrendingUp className="mr-2" />,
    'Lider': <FiAward className="mr-2" />,
    'Leading': <FiAward className="mr-2" />,
  };

  return (
    <div className="bg-blue-900/30 backdrop-blur-md rounded-xl p-6 border border-blue-800/30 space-y-6 h-full flex flex-col">
      <h2 className="text-2xl font-bold text-white">{t('sections.overview.subTitle')}</h2>
      <div className="flex items-center gap-6">
        <div className="flex-shrink-0">
          <Gauge score={score} />
        </div>
        <div className="flex-grow flex flex-col items-center justify-center">
          <motion.div
            className={`text-3xl font-semibold flex items-center ${
              score >= 70 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400'
            }`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }}
          >
            {interpretationIcons[interpretation]}
            {interpretation}
          </motion.div>
          <p className="text-sm text-white/70 mt-4 text-center">{t('contactDescription')}</p>
          <Link 
            href="https://api.whatsapp.com/send/?phone=905421386574"
            target="_blank"
            rel="noopener noreferrer"
          >
            <button className="mt-4 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-8 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">
              {t('contactUs')}
            </button>
          </Link>
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-lg mb-2">{t('sections.overview.sections.executiveSummary.title')}</h3>
        <p className="text-white/80 text-base">{executiveSummary}</p>
      </div>
      {geoScoreDetails && (
        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-blue-800/30">
          <MetricCard 
            title={t('sections.overview.sections.marketPotential.title')}
            value={geoScoreDetails.marketPotential ? geoScoreDetails.marketPotential.charAt(0).toUpperCase() + geoScoreDetails.marketPotential.slice(1) : 'N/A'}
            trend={geoScoreDetails?.growthTrend}
            description={t('sections.overview.sections.marketPotential.description')}
          />
          <MetricCard 
            title={t('sections.overview.sections.competitionIntensity.title')}
            value={geoScoreDetails.competitionIntensity ? geoScoreDetails.competitionIntensity.charAt(0).toUpperCase() + geoScoreDetails.competitionIntensity.slice(1) : 'N/A'}
            description={t('sections.overview.sections.competitionIntensity.description')}
          />
          <MetricCard 
            title={t('sections.overview.sections.growthTrend.title')}
            value={geoScoreDetails.growthTrend ? geoScoreDetails.growthTrend.charAt(0).toUpperCase() + geoScoreDetails.growthTrend.slice(1) : 'N/A'}
            trend={geoScoreDetails?.growthTrend}
            description={t('sections.overview.sections.growthTrend.description')}
          />
          <MetricCard 
            title={t('sections.overview.sections.brandAwareness.title')}
            value={geoScoreDetails.brandAwareness ? geoScoreDetails.brandAwareness.charAt(0).toUpperCase() + geoScoreDetails.brandAwareness.slice(1) : 'N/A'}
            description={t('sections.overview.sections.brandAwareness.description')}
          />
        </div>
      )}
    </div>
  );
};

export default EnhancedGeoScoreOverview;
