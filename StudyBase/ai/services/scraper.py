from youtube_transcript_api import YouTubeTranscriptApi
import fitz 
from django.conf import settings
from .s3 import s3

proxy_config=WebshareProxyConfig(
        proxy_username=settings.PROXY_USERNAME,
        proxy_password=settings.PROXY_PASSWORD,
    )

def fetch_transcript(video_id: str):
    try:
        api = YouTubeTranscriptApi(proxy=proxy_config)
        try:
            transcript = api.fetch(video_id, languages=['en', 'hi'])
        except Exception:
            t_list = api.list(video_id)
            first_transcript = next(iter(t_list))
            transcript = first_transcript.fetch()

        return [
            {
                "text": snippet.text,
                "start_time": snippet.start,
                "duration": snippet.duration,
            }
            for snippet in transcript
        ]
    except Exception as e:
        raise RuntimeError(f"Could not retrieve transcript for video '{video_id}': {e}") from e

def fetch_file(file_id: str, path_to_save: str):
    s3.download_file(
        settings.BUCKET_NAME,
        f"pdf_docs/{file_id}.pdf",
        path_to_save
    )
    return path_to_save + "/" + file_id + ".pdf"


    