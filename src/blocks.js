import '@blockcode/aisdks';
import { Text } from '@blockcode/ui';
import translations from './l10n.yaml';
import iconURI from './icon.png';
import translatePyURI from './translate.py';

// 问：把"晚上好，朋友！"翻译为日语。
// 答："晚上好，朋友！"的日语翻译是 "こんにちは、友達！"。
// 问："こんにちは、友達！"是什么语言？
// 答："こんにちは、友達！"是日语。
// 问："23:09"是什么语言？
// 答："23:09"不是任何已知的语言。

export default {
  iconURI,
  name: (
    <Text
      id="extension.translate.name"
      defaultMessage="Translate"
    />
  ),
  files: [
    {
      name: 'translate',
      type: 'text/x-python',
      uri: translatePyURI,
    },
  ],
  statusButton: {
    title: (
      <Text
        id="extension.translate.openplatform"
        defaultMessage="iFLYTEK Open Platform authorization"
      />
    ),
    storage: [
      {
        id: 'sparkai.appid',
        text: 'APPID',
      },
      {
        id: 'sparkai.apisecret',
        text: 'APISecret',
      },
      {
        id: 'sparkai.apikey',
        text: 'APIKey',
      },
    ],
    description: (
      <>
        <Text
          id="extension.translate.openplatform.description1"
          defaultMessage="Please register your own "
        />
        <a
          href="https://xinghuo.xfyun.cn/sparkapi"
          target="_blank"
        >
          <Text
            id="extension.translate.openplatform.description2"
            defaultMessage="iFLYTEK Open Platform (Chinese)"
          />
        </a>
        <Text
          id="extension.translate.openplatform.description3"
          defaultMessage=" account, the test account we provide does not guarantee that every request will be successful."
        />
      </>
    ),
  },
  blocks: [
    {
      id: 'translate',
      text: (
        <Text
          id="extension.translate.translate"
          defaultMessage="translate [WORDS] to [LANGUAGE]"
        />
      ),
      output: 'string',
      inputs: {
        WORDS: {
          type: 'string',
          default: (
            <Text
              id="extension.translate.hello"
              defaultMessage="hello"
            />
          ),
        },
        LANGUAGE: {
          type: 'string',
          default: '英语',
          menu: [
            [
              <Text
                id="extension.translate.english"
                defaultMessage="English"
              />,
              '英语',
            ],
            [
              <Text
                id="extension.translate.chinese.simplified"
                defaultMessage="Chinese (Simplified)"
              />,
              '简体中文',
            ],
            [
              <Text
                id="extension.translate.chinese.traditional"
                defaultMessage="Chinese (Traditional)"
              />,
              '繁体中文',
            ],
            [
              <Text
                id="extension.translate.japanese"
                defaultMessage="Japanese"
              />,
              '日语',
            ],
          ],
        },
      },
      python(block) {
        this.definitions_['translate_translate'] = `from extensions.translate import translate`;
        const apikey = localStorage.getItem(`sparkai.apikey`);
        const apisecret = localStorage.getItem(`sparkai.apisecret`);
        const useapi = apikey && apisecret ? `, key="${apikey}", secret="${apisecret}"` : '';
        const content = this.valueToCode(block, 'WORDS', this.ORDER_NONE) || '""';
        const language = this.quote_(block.getFieldValue('LANGUAGE') || '英文');
        const code = `(await translate.translate(str(${content}), ${language} ${useapi}))`;
        return [code, this.ORDER_FUNCTION_CALL];
      },
      vm(block) {
        const translate = provideTranslateFunctionJs.call(this);
        const content = this.valueToCode(block, 'WORDS', this.ORDER_NONE) || '""';
        const language = this.quote_(block.getFieldValue('LANGUAGE') || '英文');
        const code = `(await ${translate}(String(${content}), ${language}))`;
        return [code, this.ORDER_FUNCTION_CALL];
      },
    },
    {
      id: 'languageOf',
      text: (
        <Text
          id="extension.translate.languageOf"
          defaultMessage="language of [WORDS]"
        />
      ),
      output: 'string',
      inputs: {
        WORDS: {
          type: 'string',
          default: (
            <Text
              id="extension.translate.hello"
              defaultMessage="hello"
            />
          ),
        },
      },
      python(block) {
        this.definitions_['translate_translate'] = `from extensions.translate import translate`;
        const apikey = localStorage.getItem(`sparkai.apikey`);
        const apisecret = localStorage.getItem(`sparkai.apisecret`);
        const useapi = apikey && apisecret ? `, key="${apikey}", secret="${apisecret}"` : '';
        const content = this.valueToCode(block, 'WORDS', this.ORDER_NONE) || '""';
        const code = `(await translate.translate(str(${content}) ${useapi}))`;
        return [code, this.ORDER_FUNCTION_CALL];
      },
      vm(block) {
        const translate = provideTranslateFunctionJs.call(this);
        const content = this.valueToCode(block, 'WORDS', this.ORDER_NONE) || '""';
        const code = `(await ${translate}(String(${content})))`;
        return [code, this.ORDER_FUNCTION_CALL];
      },
    },
    {
      id: 'language',
      text: (
        <Text
          id="extension.translate.language"
          defaultMessage="language"
        />
      ),
      output: 'string',
      python() {
        this.definitions_['translate_translate'] = `from extensions.translate import translate`;
        return ['translate.language_name()', this.ORDER_FUNCTION_CALL];
      },
      vm() {
        const getLanguage = provideGetLanguageFunctionJs.call(this);
        return [`${getLanguage}()`, this.ORDER_FUNCTION_CALL];
      },
    },
  ],
  translations,
};

function provideGetLanguageFunctionJs() {
  return this.provideFunction_('translate_language', [
    `const ${this.FUNCTION_NAME_PLACEHOLDER_} = (i = 0) => {`,
    '  switch(runtime.language) {',
    `    case 'en': return ['English', '英语'][i];`,
    `    case 'jp': return ['日本語', '日语'][i];`,
    `    case 'zh-Hans': return ['简体中文', '简体中文'][i];`,
    `    default: return ['English', '英语'][i];`,
    '  }',
    '};',
  ]);
}

function provideTranslateFunctionJs() {
  const getLanguage = provideGetLanguageFunctionJs.call(this);
  return this.provideFunction_('translate_translate', [
    `const ${this.FUNCTION_NAME_PLACEHOLDER_} = async (content, language) => {`,
    `  if (!content) return '';`,
    `  let message = await window.ai.askSpark([{`,
    `    role: 'user', `,
    '    content: language ? `把"${content}"翻译为${language}。` : `"${content}"是什么语言？`,',
    `  }]);`,
    '  if (language) {',
    '    const matches = /("[^"]*"[^"“「]*)?["“「]([^"”」]*)["”」]/.exec(message);',
    '    if (matches) {',
    `      message = matches[2];`,
    '    } else {',
    `      let i = message.lastIndexOf('(');`,
    `      i = i === -1 ?? message.lastIndexOf('（');`,
    `      message = i === -1 ? message : message.slice(0, i);`,
    '    }',
    '  } else {',
    `    if (message.match(/不是[^语]*[语文]/)) return '';`,
    '    const matches = /是([^语]*[语文])/.exec(message);',
    `    if (!matches) return '';`,
    '    message = matches[1];',
    `    if (runtime.language !== 'zh-Hans') {`,
    `      language = ${getLanguage}(1);`,
    `      message = await ${this.FUNCTION_NAME_PLACEHOLDER_}(message, language);`,
    `    }`,
    '  }',
    '  return message;',
    '};',
  ]);
}
