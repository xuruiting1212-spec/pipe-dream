"""
Pipe Dream — 本地 Whisper 语音转文字服务

使用 faster-whisper（CTranslate2 后端），比 openai-whisper 更轻量更快。

启动方式:
    cd whisper_server
    pip install -r requirements.txt   （首次约下载 50MB 依赖）
    python server.py                  （首次会自动下载 base 模型 ~150MB）

服务地址: http://localhost:8765
"""

import os
import tempfile
import shutil

# 国内用户：使用 Hugging Face 镜像下载模型
# 如果你在境外，可以把这行注释掉
os.environ.setdefault("HF_ENDPOINT", "https://hf-mirror.com")

import httpx
from faster_whisper import WhisperModel
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from opencc import OpenCC

# 繁体→简体 转换器
cc = OpenCC('t2s')  # t2s = Traditional to Simplified

app = FastAPI(title="Pipe Dream Whisper Server")

# 允许前端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 全局加载模型（首次启动时会自动下载约 150MB）
print("⏳ 正在加载 Whisper base 模型...")
model = WhisperModel("base", device="cpu", compute_type="int8")
print("✅ Whisper 模型就绪")


class TranscribeRequest(BaseModel):
    audio_url: str


class TranscribeResponse(BaseModel):
    text: str


@app.post("/transcribe", response_model=TranscribeResponse)
async def transcribe(req: TranscribeRequest):
    """
    接收音频文件 URL，下载后用 Whisper 转文字，返回文本。

    请求体:
        { "audio_url": "https://..." }

    返回:
        { "text": "转录后的文字" }
    """
    audio_url = req.audio_url.strip()
    if not audio_url:
        raise HTTPException(status_code=400, detail="audio_url 不能为空")

    tmp_dir = tempfile.mkdtemp()
    audio_path = None

    try:
        # 1. 下载音频文件
        print(f"📥 下载音频: {audio_url}")
        async with httpx.AsyncClient(timeout=120, follow_redirects=True) as client:
            resp = await client.get(audio_url)
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=400,
                    detail=f"下载音频失败 (HTTP {resp.status_code})",
                )

        # 2. 保存到临时文件
        content_type = resp.headers.get("content-type", "")
        ext = _guess_extension(audio_url, content_type)
        audio_path = os.path.join(tmp_dir, f"audio{ext}")

        with open(audio_path, "wb") as f:
            f.write(resp.content)

        file_size = os.path.getsize(audio_path)
        print(f"📁 已保存: {audio_path} ({file_size / 1024:.1f} KB)")

        # 3. faster-whisper 转录
        print("🎙️ 正在转录...")
        segments, info = model.transcribe(audio_path, language="zh")
        text = " ".join(seg.text.strip() for seg in segments).strip()

        # 4. 繁体→简体转换
        text = cc.convert(text)

        print(f"📝 转录完成: {text[:100]}{'...' if len(text) > 100 else ''}")
        return TranscribeResponse(text=text)

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ 转录失败: {e}")
        raise HTTPException(status_code=500, detail=f"转录失败: {str(e)}")
    finally:
        # 清理临时文件
        try:
            shutil.rmtree(tmp_dir, ignore_errors=True)
        except Exception:
            pass


@app.get("/health")
async def health():
    return {"status": "ok", "model": "whisper base (faster-whisper)"}


def _guess_extension(url: str, content_type: str) -> str:
    """从 URL 或 Content-Type 推断文件扩展名"""
    url_lower = url.split("?")[0].lower()
    for ext in [".mp3", ".wav", ".m4a", ".ogg", ".webm", ".flac", ".aac", ".wma"]:
        if ext in url_lower:
            return ext

    ct_map = {
        "audio/mpeg": ".mp3",
        "audio/wav": ".wav",
        "audio/wave": ".wav",
        "audio/x-wav": ".wav",
        "audio/mp4": ".m4a",
        "audio/x-m4a": ".m4a",
        "audio/ogg": ".ogg",
        "audio/webm": ".webm",
        "audio/flac": ".flac",
        "audio/aac": ".aac",
        "audio/x-ms-wma": ".wma",
    }
    return ct_map.get(content_type.split(";")[0].strip(), ".mp3")


if __name__ == "__main__":
    import uvicorn

    print("=" * 50)
    print("Pipe Dream Whisper 服务启动")
    print("地址: http://localhost:8765")
    print("接口: POST /transcribe")
    print("=" * 50)
    uvicorn.run(app, host="127.0.0.1", port=8765, log_level="info")
