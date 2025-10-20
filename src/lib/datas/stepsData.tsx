/* eslint-disable @typescript-eslint/no-unused-vars */
import { FiArrowLeft, FiSearch, FiBarChart2, FiFileText, FiCheckCircle, FiArrowRight } from 'react-icons/fi';

export const stepsData = [
    {
      id: 1,
      icon: <FiSearch />,
      title: "Web Sitesi URL'si Girişi",
      description: "Analiz edilmesini istediğiniz web sitesinin URL'sini girerek süreci başlatırsınız."
    },
    {
      id: 2,
      icon: <FiBarChart2 />,
      title: "AI Platformlarında Tarama",
      description: "Sistemimiz, sitenizi ChatGPT, Google Gemini, Perplexity gibi önde gelen yapay zeka platformlarında tarar ve görünürlüğünü ölçer."
    },
    {
      id: 3,
      icon: <FiFileText />,
      title: "İçerik Analizi",
      description: "Web sitenizin içeriği yapay zeka dostu olma açısından analiz edilir. Okunabilirlik, kapsamlılık, özgünlük gibi faktörler değerlendirilir."
    },
    {
      id: 4,
      icon: <FiCheckCircle />,
      title: "Rapor ve Öneriler",
      description: "Kapsamlı bir rapor ve iyileştirme önerileri sunulur. Bu öneriler, sitenizin AI aramalarında daha iyi görünmesini sağlayacak adımları içerir."
    }
  ];