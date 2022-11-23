import locales from './locales';

export default function localize({ locale, topic, string }) {
  return locales[locale][topic][string]; 
}