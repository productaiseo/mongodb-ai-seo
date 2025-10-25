import { useTranslations } from "next-intl";

const Footer = () => {
  const t = useTranslations("Footer");

  return (
    <footer className="w-full mt-24 py-8 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        <div className="text-white/60 text-sm mb-4 md:mb-0">
          © {t("company")} {t("rights")}
        </div>
        <div className="flex gap-4">
          <a
            href="#"
            className="text-white/60 hover:text-white/90 transition-colors text-sm"
          >
            {t("privacy")}
          </a>
          <a
            href="#"
            className="text-white/60 hover:text-white/90 transition-colors text-sm"
          >
            {t("terms")}
          </a>
          <a
            href="#"
            className="text-white/60 hover:text-white/90 transition-colors text-sm"
          >
            {t("contact")}
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
