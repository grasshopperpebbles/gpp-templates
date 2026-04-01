#!/usr/bin/env python3
"""
Fetch top videos and transcripts from a YouTube channel.

Usage:
    python3 fetch_channel.py <channel_url> [--top N] [--type long|short]

Output:
    JSON file with video metadata + transcripts written to ./channel_data.json
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path

# Resolve yt-dlp binary: prefer the venv's copy next to this script
SCRIPT_DIR = Path(__file__).resolve().parent
VENV_BIN = SCRIPT_DIR / ".venv" / "bin"
YT_DLP = str(VENV_BIN / "yt-dlp") if (VENV_BIN / "yt-dlp").exists() else "yt-dlp"

def resolve_channel_url(url: str) -> str:
    """Normalize channel URL to the /videos tab."""
    url = url.rstrip("/")
    if not url.endswith("/videos"):
        url += "/videos"
    return url

def fetch_video_list(channel_url: str, cookies_from_browser: str | None = None) -> list[dict]:
    """Use yt-dlp to get flat metadata for all videos on a channel."""
    cmd = [
        YT_DLP,
        "--flat-playlist",
        "-j",
        "--no-warnings",
    ]
    if cookies_from_browser:
        cmd += ["--cookies-from-browser", cookies_from_browser]
    cmd.append(channel_url)
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error fetching channel: {result.stderr}", file=sys.stderr)
        sys.exit(1)

    videos = []
    for line in result.stdout.strip().split("\n"):
        if line:
            try:
                videos.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return videos

def filter_and_sort(videos: list[dict], video_type: str, top_n: int) -> list[dict]:
    """Filter by type (long/short) and sort by view count descending."""
    filtered = []
    for v in videos:
        duration = v.get("duration") or 0
        if video_type == "long" and duration <= 60:
            continue
        if video_type == "short" and duration > 60:
            continue
        filtered.append(v)

    filtered.sort(key=lambda v: v.get("view_count") or 0, reverse=True)
    return filtered[:top_n]

def fetch_transcript(video_id: str) -> str | None:
    """Fetch transcript using youtube-transcript-api."""
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        ytt = YouTubeTranscriptApi()
        transcript = ytt.fetch(video_id, languages=["en", "en-US", "en-GB"])
        return " ".join(entry.text for entry in transcript)
    except Exception as e:
        print(f"  Could not fetch transcript for {video_id}: {e}", file=sys.stderr)
        return None

def fetch_full_metadata(video_id: str, cookies_from_browser: str | None = None) -> dict:
    """Use yt-dlp to get full metadata for a single video."""
    cmd = [
        YT_DLP,
        "-j",
        "--no-warnings",
        "--skip-download",
        "--remote-components", "ejs:github",
    ]
    if cookies_from_browser:
        cmd += ["--cookies-from-browser", cookies_from_browser]
    cmd.append(f"https://www.youtube.com/watch?v={video_id}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        try:
            return json.loads(result.stdout)
        except json.JSONDecodeError:
            return {}
    return {}

def main():
    parser = argparse.ArgumentParser(description="Fetch top YouTube channel videos and transcripts")
    parser.add_argument("channel_url", help="YouTube channel URL (e.g. https://www.youtube.com/@genuinedata)")
    parser.add_argument("--top", type=int, default=5, help="Number of top videos to fetch (default: 5)")
    parser.add_argument("--type", choices=["long", "short"], default="long", help="Video type: long (>60s) or short (<=60s)")
    parser.add_argument("--output", type=str, default=None, help="Output JSON file path (default: ./channel_data.json)")
    parser.add_argument("--cookies-from-browser", type=str, default=None, help="Browser to extract cookies from (e.g. chrome, safari)")
    args = parser.parse_args()

    channel_url = resolve_channel_url(args.channel_url)
    print(f"Fetching video list from {channel_url}...")

    videos = fetch_video_list(channel_url, args.cookies_from_browser)
    print(f"Found {len(videos)} total videos.")

    top_videos = filter_and_sort(videos, args.type, args.top)
    print(f"Selected top {len(top_videos)} {args.type}-form videos by view count.\n")

    results = []
    for i, v in enumerate(top_videos, 1):
        video_id = v.get("id") or v.get("url", "").split("v=")[-1]
        title = v.get("title", "Unknown")
        views = v.get("view_count", 0)
        print(f"[{i}/{len(top_videos)}] {title} ({views:,} views)")

        print(f"  Fetching full metadata...")
        full_meta = fetch_full_metadata(video_id, args.cookies_from_browser)

        print(f"  Fetching transcript...")
        transcript = fetch_transcript(video_id)

        results.append({
            "video_id": video_id,
            "title": full_meta.get("title", title),
            "url": f"https://www.youtube.com/watch?v={video_id}",
            "view_count": full_meta.get("view_count", views),
            "like_count": full_meta.get("like_count"),
            "comment_count": full_meta.get("comment_count"),
            "duration": full_meta.get("duration"),
            "duration_string": full_meta.get("duration_string"),
            "upload_date": full_meta.get("upload_date"),
            "description": full_meta.get("description"),
            "tags": full_meta.get("tags"),
            "categories": full_meta.get("categories"),
            "channel": full_meta.get("channel"),
            "channel_url": full_meta.get("channel_url"),
            "thumbnail": full_meta.get("thumbnail"),
            "transcript": transcript,
        })
        print()

    output_path = args.output or "channel_data.json"
    Path(output_path).write_text(json.dumps(results, indent=2, ensure_ascii=False))
    print(f"Data written to {output_path}")
    print(f"Total videos with transcripts: {sum(1 for r in results if r['transcript'])}/{len(results)}")

if __name__ == "__main__":
    main()
