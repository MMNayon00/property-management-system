// i18n hook and context for managing translations

import translations from "./bn";

export const useTranslation = () => {
  // Default language is Bangla
  return {
    t: translations,
    lang: "bn",
  };
};

export default translations;
