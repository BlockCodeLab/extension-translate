import aiohttp

SPARKAI_KEY = "6a3dfe79b9e9ec588ca65bf3b9d9c847"
SPARKAI_SECRET = "MWFiNjVmNDA4YjNhODFkZGE0MGQ1YWRj"

SPARKAI_URL = "https://spark-api-open.xf-yun.com/v1/chat/completions"
SPARKAI_HEADERS = {"Authorization": f"Bearer {SPARKAI_KEY}:{SPARKAI_SECRET}"}


async def ask(messages, model="general"):
    data = {"model": model, "messages": messages}
    async with aiohttp.ClientSession(headers=SPARKAI_HEADERS) as session:
        async with session.post(SPARKAI_URL, json=data) as response:
            content = ""
            if response.status == 200:
                json_data = await response.json()
                content = json_data["choices"][0]["message"]["content"]
            return content
