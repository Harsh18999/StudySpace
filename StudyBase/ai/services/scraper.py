from supadata import Supadata, SupadataError
import fitz 
from django.conf import settings
from ai.models import IndexVideos
from .s3 import s3

def fetch_transcript(video_id: str, lang: str = 'es'):
    # Check if transcript already exists in indexed video table
    try:
        indexed_video = IndexVideos.objects.filter(video_id=video_id).first()
        if indexed_video:
            existing_transcript = getattr(indexed_video, 'tanscript', None) or getattr(indexed_video, 'transcript', None)
            if existing_transcript:
                return existing_transcript
    except Exception:
        pass

    # Fetch from Supadata API
    try:
        api_key = settings.SUPADATA_API_KEY
        supadata = Supadata(api_key=api_key)

        kwargs = {"video_id": video_id}
        if lang:
            kwargs["lang"] = lang

        transcript_response = supadata.youtube.transcript(**kwargs)

        if hasattr(transcript_response, 'content') and transcript_response.content is not None:
            raw_chunks = transcript_response.content
        elif isinstance(transcript_response, dict) and 'content' in transcript_response:
            raw_chunks = transcript_response['content']
        elif isinstance(transcript_response, (list, tuple)):
            raw_chunks = transcript_response
        else:
            raw_chunks = transcript_response

        formatted_transcript = []
        for chunk in raw_chunks:
            if isinstance(chunk, dict):
                text = chunk.get("text", "")
                offset = chunk.get("offset", 0)
                duration = chunk.get("duration", 0)
                chunk_lang = chunk.get("lang", lang or "en")
            else:
                text = getattr(chunk, "text", "")
                offset = getattr(chunk, "offset", 0)
                duration = getattr(chunk, "duration", 0)
                chunk_lang = getattr(chunk, "lang", lang or "en")

            start_time = offset / 1000.0 if isinstance(offset, (int, float)) and offset > 500 else offset

            formatted_transcript.append({
                "text": text,
                "offset": offset,
                "duration": duration,
                "lang": chunk_lang,
                "start_time": start_time,
            })

        return formatted_transcript

    except SupadataError as e:
        raise RuntimeError(f"Supadata API error for video '{video_id}': {e}") from e
    except Exception as e:
        raise RuntimeError(f"Could not retrieve transcript for video '{video_id}': {e}") from e

def fetch_file(file_id: str, path_to_save: str):
    s3.download_file(
        settings.BUCKET_NAME,
        f"pdf_docs/{file_id}.pdf",
        path_to_save
    )
    return path_to_save + "/" + file_id + ".pdf"


    