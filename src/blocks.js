import hmacSHA256 from 'crypto-js/hmac-sha256';
import Base64 from 'crypto-js/enc-base64';
import { Text } from '@blockcode/ui';
import translations from './l10n.yaml';
import iconURI from './icon.png';

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

const getWebSocketUrl = () => {
  const date = new Date().toGMTString();

  const signatureRaw = `host: ${SPARKAI_HOST}\ndate: ${date}\nGET ${SPARKAI_PATHNAME} HTTP/1.1`;
  const signature = Base64.stringify(hmacSHA256(signatureRaw, SPARKAI_API_SECRET));

  const authorizationRaw = `api_key="${SPARKAI_API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
  const authorization = btoa(authorizationRaw);

  return `wss://${SPARKAI_HOST}${SPARKAI_PATHNAME}?authorization=${authorization}&date=${date}&host=${SPARKAI_HOST}`;
};

function provideLanguageFunctionJs() {
  return this.provideFunction_('translate_language', [
    `const ${this.FUNCTION_NAME_PLACEHOLDER_} = (i = 0) => {`,
    '  switch(runtime.language) {',
    `    case 'en': return ['English', '英语'][i];`,
    `    case 'jp': return ['日本語', '日语'][i];`,
    `    case 'zh-Hans': return ['简体中文', '简体中文'][i];`,
    `    default: return ['简体中文', '简体中文'][i];`,
    '  }',
    '};',
  ]);
}

function provideTranslateFunctionJs() {
  const language = provideLanguageFunctionJs.call(this);
  return this.provideFunction_('translate_translate', [
    `const ${this.FUNCTION_NAME_PLACEHOLDER_} = (content, language) => new Promise((resolve) => {`,
    '  if (!runtime.wifiConnected || !content) {',
    `    return resolve('');`,
    '  }',
    `  const ws = new WebSocket(\`${getWebSocketUrl()}\`); `,
    '  ws.onopen = () => {',
    '    ws.send(JSON.stringify({',
    '      header: {',
    `          app_id: '${SPARKAI_APP_ID}', `,
    `          uid: '${SPARKAI_APP_ID}', `,
    '        },',
    '        parameter: {',
    '          chat: {',
    `            domain: '${SPARKAI_DOMAIN}', `,
    '            temperature: 0.1,',
    '            max_tokens: 1024,',
    '            top_k: 1,',
    '          },',
    '        },',
    '        payload: {',
    '          message: {',
    '            text: [',
    '              {',
    `                role: 'user', `,
    '                content: language ? `把"${content}"翻译为${ language } ` : `"${content}"是什么语言？`,',
    '              },',
    '            ],',
    '          },',
    '        },',
    '    }));',
    '  };',
    `  ws.onerror = (e) => resolve(''); `,
    `  let message = ''; `,
    '  ws.onmessage = async (e) => {',
    '    const data = JSON.parse(e.data);',
    '    if (data.header.code !== 0) {',
    `      return resolve(''); `,
    '    }',
    `    message += data.payload.choices.text.map((text) => text.content).join(''); `,
    '    if (data.header.status === 2) {',
    '      ws.close();',
    '      if (language) {',
    '        const matches = message.match(/"[^"]*"/g);',
    '        if (!matches) {',
    `          message = message.slice(0, message.lastIndexedOf('('));`,
    '        } else {',
    `          message = matches.pop().replaceAll('"', '');`,
    '        }',
    '      } else {',
    '        if (message.match(/不是[^语]*[语文]/g)) {',
    `          return resolve(''); `,
    '        }',
    '        const matches = /是([^语]*[语文])/.exec(message);',
    '        if (!matches) {',
    `          return resolve(''); `,
    '        }',
    '        message = matches[1];',
    `        if (runtime.language !== 'zh-Hans') {`,
    `          language = ${language}(1);`,
    `          message = await ${this.FUNCTION_NAME_PLACEHOLDER_}(message, language);`,
    `        }`,
    '      }',
    '      resolve(message);',
    '    }',
    '  };',
    '});',
  ]);
}

export default {
  iconURI,
  name: (
    <Text
      id="extension.translate.name"
      defaultMessage="Translate"
    />
  ),
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
      vm(block) {
        const translate = provideTranslateFunctionJs.call(this);
        const content = this.valueToCode(block, 'WORDS', this.ORDER_NONE) || '""';
        const language = this.quote_(block.getFieldValue('LANGUAGE') || '英文');
        const code = `(await ${translate}(${content}, ${language}))`;
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
      vm(block) {
        const translate = provideTranslateFunctionJs.call(this);
        const content = this.valueToCode(block, 'WORDS', this.ORDER_NONE) || '""';
        const code = `(await ${translate}(${content}))`;
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
      vm() {
        const language = provideLanguageFunctionJs.call(this);
        return [`${language}()`, this.ORDER_FUNCTION_CALL];
      },
    },
  ],
  translations,
};
