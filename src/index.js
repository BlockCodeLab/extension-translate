import featureImage from './feature.png';
import iconImage from './icon.png';

export default {
  name: 'Translate',
  description: 'Translate Text into many languages.',
  collaborator: 'iFLYTEK Spark',
  image: featureImage,
  icon: iconImage,
  tags: ['blocks', 'data', 'internet', 'ai'],
  internetRequired: true,

  // l10n
  translations: {
    en: {
      name: 'Translate',
      description: 'Translate Text into many languages.',
      collaborator: 'iFLYTEK Spark',
    },
    'zh-Hans': {
      name: '翻译',
      description: '把文字翻译成多种语言。',
      collaborator: '讯飞星火',
    },
  },
};
