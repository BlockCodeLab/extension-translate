from micropython import const
from language import language_id
from scratch import runtime
from aisdks import sparkai

LANGUAGES = {
    "en": ("English", "英语"),
    "jp": ("日本語", "日语"),
    "zh-Hans": ("简体中文", "简体中文"),
}


def language_name(i=0):
    return LANGUAGES.get(language_id, LANGUAGES["en"])[i]


def _translate(message):
    # “message”
    i = message.rfind("“")
    if i != -1:
        j = message.rfind("”")
        return message[i + 1 : j]

    # 「message」
    i = message.rfind("「")
    if i != -1:
        j = message.rfind("」")
        return message[i + 1 : j]

    # "message"
    i = message.rfind('"')
    if i != -1:
        j = message.rfind('"', 0, i - 1)
        return message[j + 1 : i]

    i = message.rfind("(")
    if i == -1:
        i = message.rfind("（")
    if i != -1:
        return message[0:i]

    return message


async def translate(
    content, lang=None, key=sparkai.SPARKAI_KEY, secret=sparkai.SPARKAI_SECRET
):
    if not runtime.wifi_connected or not content:
        return ""

    if lang:
        content = f'把"{content}"翻译为{lang}。'
    else:
        content = f'"{content}"是什么语言？'

    message = await sparkai.ask(
        [
            {"role": "user", "content": content},
        ],
        key=key,
        secret=secret,
    )

    if lang:
        return _translate(message)

    if message.find("不是") != -1:
        message = "未知语言"
    else:
        i = message.find("是")
        if i == -1:
            message = "未知语言"
        else:
            j = message.find("语", i)
            if j == -1:
                j = message.find("文", i)
            if j == -1:
                message = "未知语言"
            else:
                message = message[i + 1 : j + 1]

    if language_id == "zh-Hans":
        return message

    return await translate(message, language_name(1))
