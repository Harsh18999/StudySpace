import re
import requests
from django.core.exceptions import ValidationError
from django.conf import settings

YOUTUBE_VIDEO_REGEX = re.compile(
    r"^(?:https?://)?(?:www\.)?"
    r"(?:youtube\.com/(?:watch\?v=|embed/|shorts/)|youtu\.be/)"
    r"(?P<video_id>[A-Za-z0-9_-]{11})"
)


PLAYLIST_REGEX = re.compile(
    r"^(?:https?://)?(?:www\.)?"
    r"youtube\.com/playlist\?list="
    r"(?P<playlist_id>[A-Za-z0-9_-]+)"
    r"(?:&.*)?$"
)


def validate_youtube_video_url(url: str) -> str:
    match = YOUTUBE_VIDEO_REGEX.match(url)

    if not match:
        raise ValidationError("Invalid YouTube URL.")

    return match.group("video_id")


def validate_youtube_playlist_url(url: str) -> str:
    match = PLAYLIST_REGEX.match(url)

    if not match:
        raise ValidationError("Invalid YouTube playlist URL.")

    return match.group("playlist_id")


def get_video_details(video_id):
    url = "https://www.googleapis.com/youtube/v3/videos"

    params = {
        "part": "snippet,contentDetails",
        "id": video_id,
        "key": settings.YOUTUBE_API_KEY,
    }

    response = requests.get(url, params=params)
    response.raise_for_status()

    data = response.json()

    if not data.get("items"):
        return None

    return data["items"][0]


def get_playlist_details(playlist_id):
    url = "https://www.googleapis.com/youtube/v3/playlistItems"
    url_duration = "https://www.googleapis.com/youtube/v3/videos"
    params = {
        "part": "snippet,contentDetails",
        "playlistId": playlist_id,
        "key": settings.YOUTUBE_API_KEY,
        "maxResults": 50
    }
    page_token = None
    content = []
    
    while True:
        if page_token:
            params["pageToken"] = page_token
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        items = data.get('items', [])
        if not items:
            break

        # Filter valid video IDs
        valid_video_ids = [
            item['contentDetails']['videoId']
            for item in items
            if item.get('contentDetails', {}).get('videoId')
        ]
        
        if valid_video_ids:
            video_ids = ",".join(valid_video_ids)
            details_resp = requests.get(url_duration, params={
                "part": "snippet,contentDetails",
                "id": video_ids,
                "key": settings.YOUTUBE_API_KEY,
            })
            details_resp.raise_for_status()
            details_data = details_resp.json()

            # Map video durations by ID to handle missing/deleted videos gracefully
            duration_map = {
                v['id']: v.get('contentDetails', {}).get('duration')
                for v in details_data.get('items', [])
            }
        else:
            duration_map = {}

        for item in items:
            snippet = item.get('snippet', {})
            title = snippet.get('title', '')
            if title in ['Private video', 'Deleted video']:
                continue

            vid = item.get('contentDetails', {}).get('videoId')
            if not vid:
                continue

            item['contentDetails']['duration'] = duration_map.get(vid, "PT0S")
            content.append(item)
        
        page_token = data.get('nextPageToken')
        if not page_token:
            break
    
    return content