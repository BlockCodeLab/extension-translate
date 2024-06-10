import hmacSHA256 from 'crypto-js/hmac-sha256';
import Base64 from 'crypto-js/enc-base64';
import { Text } from '@blockcode/ui';
import translations from './l10n.yaml';
import iconURI from './icon.png';
import translatePyURI from './translate.py';

// top-k=1, temperature=0.1
// 问：把"晚上好，朋友！"翻译为日语。
// 答："晚上好，朋友！"的日语翻译是 "こんにちは、友達！"。
// 问："こんにちは、友達！"是什么语言？
// 答："こんにちは、友達！"是日语。
// 问："23:09"是什么语言？
// 答："23:09"不是任何已知的语言。

const SPARKAI_HOST = 'spark-api.xf-yun.com';
const SPARKAI_PATHNAME = '/v1.1/chat';
const SPARKAI_APP_ID = 'db45f79e';
const SPARKAI_API_SECRET = 'MWFiNjVmNDA4YjNhODFkZGE0MGQ1YWRj';
const SPARKAI_API_KEY = '6a3dfe79b9e9ec588ca65bf3b9d9c847';
const SPARKAI_DOMAIN = 'general';
const SPARKAI_TEMPERATURE = 0.1; // 0.1 ~ 1
const SPARKAI_MAX_TOKENS = 1024; // 1 token = 1.5 chinese or 0.8 english
const SPARKAI_TOP_K = 1; // 1 ~ 6

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
  connectionConfig: {
    title: (
      <Text
        id="extension.translate.openplatform"
        defaultMessage="iFLYTEK Open Platform authorization"
      />
    ),
    items: [
      {
        id: 'appid',
        text: 'APPID',
      },
      {
        id: 'apisecret',
        text: 'APISecret',
      },
      {
        id: 'apikey',
        text: 'APIKey',
      },
    ],
    description: (
      <Text
        id="extension.translate.openplatform.description"
        defaultMessage="Please register your own <a href='https://xinghuo.xfyun.cn/sparkapi'>iFLYTEK Open Platform (Chinese)</a> account, the test account we provide does not guarantee that every request will be successful."
      />
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
          default: 'english',
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
        const content = this.valueToCode(block, 'WORDS', this.ORDER_NONE) || '""';
        const language = this.quote_(block.getFieldValue('LANGUAGE') || '英文');
        const code = `(await translate.translate(str(${content}), ${language}))`;
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
        const content = this.valueToCode(block, 'WORDS', this.ORDER_NONE) || '""';
        const code = `(await translate.translate(str(${content})))`;
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

const getWebSocketUrl = () => {
  const date = new Date().toGMTString();
  const apisecret = localStorage.getItem(`brain.connection.apisecret`) || SPARKAI_API_SECRET;
  const apikey = localStorage.getItem(`brain.connection.apikey`) || SPARKAI_API_KEY;

  const signatureRaw = `host: ${SPARKAI_HOST}\ndate: ${date}\nGET ${SPARKAI_PATHNAME} HTTP/1.1`;
  const signature = Base64.stringify(hmacSHA256(signatureRaw, apisecret));

  const authorizationRaw = `api_key="${apikey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
  const authorization = btoa(authorizationRaw);

  return `wss://${SPARKAI_HOST}${SPARKAI_PATHNAME}?authorization=${authorization}&date=${date}&host=${SPARKAI_HOST}`;
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
  const appid = localStorage.getItem(`brain.connection.appid`) || SPARKAI_APP_ID;
  return this.provideFunction_('translate_translate', [
    `const ${this.FUNCTION_NAME_PLACEHOLDER_} = (content, language) => new Promise((resolve) => {`,
    '  if (!content) {',
    `    return resolve('');`,
    '  }',
    `  const ws = new WebSocket(\`${getWebSocketUrl()}\`); `,
    '  ws.onopen = () => {',
    '    ws.send(JSON.stringify({',
    '      header: {',
    `          app_id: '${appid}', `,
    `          uid: '${appid}', `,
    '        },',
    '        parameter: {',
    '          chat: {',
    `            domain: '${SPARKAI_DOMAIN}', `,
    `            temperature: ${SPARKAI_TEMPERATURE},`,
    `            max_tokens: ${SPARKAI_MAX_TOKENS},`,
    `            top_k: ${SPARKAI_TOP_K},`,
    '          },',
    '        },',
    '        payload: {',
    '          message: {',
    '            text: [',
    '              {',
    `                role: 'user', `,
    '                content: language ? `把"${content}"翻译为${language}。` : `"${content}"是什么语言？`,',
    '              },',
    '            ],',
    '          },',
    '        },',
    '    }));',
    '  };',
    `  ws.onerror = (e) => resolve(''); `,
    `  let message = ''; `,
    '  ws.onmessage = async (e) => {',
    '    if (!runtime.running) return;',
    '    const data = JSON.parse(e.data);',
    '    if (data.header.code !== 0) {',
    `      return resolve(''); `,
    '    }',
    `    message += data.payload.choices.text.map((text) => text.content).join(''); `,
    '    if (data.header.status === 2) {',
    '      ws.close();',
    '      message = message.trim();',
    '      if (language) {',
    '        const matches = /("[^"]*"[^"“「]*)?["“「]([^"”」]*)["”」]/.exec(message);',
    '        if (matches) {',
    `          message = matches[2];`,
    '        } else {',
    `          let i = message.lastIndexOf('(');`,
    `          i = i === -1 ?? message.lastIndexOf('（');`,
    `          message = i === -1 ? message : message.slice(0, i);`,
    '        }',
    '      } else {',
    '        if (message.match(/不是[^语]*[语文]/)) {',
    `          return resolve(''); `,
    '        }',
    '        const matches = /是([^语]*[语文])/.exec(message);',
    '        if (!matches) {',
    `          return resolve(''); `,
    '        }',
    '        message = matches[1];',
    `        if (runtime.language !== 'zh-Hans') {`,
    `          language = ${getLanguage}(1);`,
    `          message = await ${this.FUNCTION_NAME_PLACEHOLDER_}(message, language);`,
    `        }`,
    '      }',
    '      resolve(message);',
    '    }',
    '  };',
    '});',
  ]);
}
