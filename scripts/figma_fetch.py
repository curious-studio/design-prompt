#!/usr/bin/env python3
"""Simple Figma fetcher.

Usage (after setting environment variables or a .env):
  python scripts/figma_fetch.py --file-json        # save full file JSON
  python scripts/figma_fetch.py --nodes N1,N2     # save nodes JSON
  python scripts/figma_fetch.py --images N1,N2    # export images for node ids

Set `FIGMA_TOKEN` and `FIGMA_FILE_KEY` in environment or a .env file.
"""
import os
import sys
import argparse
import json
from urllib.parse import quote_plus

try:
    import requests
except Exception:
    print("Missing dependency 'requests'. Install with: pip install -r requirements.txt")
    sys.exit(1)


FIGMA_TOKEN = os.getenv("FIGMA_TOKEN")
FILE_KEY = os.getenv("FIGMA_FILE_KEY")

HEADERS = {"X-Figma-Token": FIGMA_TOKEN} if FIGMA_TOKEN else {}


def ensure_outdir():
    out = os.path.join("assets", "figma")
    os.makedirs(out, exist_ok=True)
    return out


def fetch_file_json(file_key):
    url = f"https://api.figma.com/v1/files/{file_key}"
    r = requests.get(url, headers=HEADERS)
    r.raise_for_status()
    out = ensure_outdir()
    path = os.path.join(out, f"{file_key}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(r.json(), f, indent=2)
    print(f"Saved file JSON to {path}")


def fetch_nodes(file_key, node_ids):
    ids_param = ",".join(node_ids)
    url = f"https://api.figma.com/v1/files/{file_key}/nodes?ids={quote_plus(ids_param)}"
    r = requests.get(url, headers=HEADERS)
    r.raise_for_status()
    out = ensure_outdir()
    path = os.path.join(out, f"{file_key}_nodes_{'_'.join(node_ids)}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(r.json(), f, indent=2)
    print(f"Saved nodes JSON to {path}")


def export_images(file_key, node_ids, fmt="png", scale=1):
    ids_param = ",".join(node_ids)
    url = f"https://api.figma.com/v1/images/{file_key}?ids={quote_plus(ids_param)}&format={fmt}&scale={scale}"
    r = requests.get(url, headers=HEADERS)
    r.raise_for_status()
    images = r.json().get("images", {})
    out = ensure_outdir()
    for node_id, img_url in images.items():
        if not img_url:
            print(f"No image url for {node_id}")
            continue
        resp = requests.get(img_url)
        resp.raise_for_status()
        path = os.path.join(out, f"{node_id}.{fmt}")
        with open(path, "wb") as f:
            f.write(resp.content)
        print(f"Saved image {path}")


def parse_node_list(s):
    return [p.strip() for p in s.split(",") if p.strip()]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--file-json", action="store_true", help="Save full file JSON")
    parser.add_argument("--nodes", type=str, help="Comma-separated node ids to fetch JSON for")
    parser.add_argument("--images", type=str, help="Comma-separated node ids to export images for")
    parser.add_argument("--format", default="png", choices=["png", "jpg", "svg"], help="Image format")
    parser.add_argument("--scale", type=int, default=1, help="Image scale (1,2,3)")
    args = parser.parse_args()

    if not FILE_KEY or not HEADERS:
        print("Please set FIGMA_FILE_KEY and FIGMA_TOKEN environment variables (see .env.example)")
        sys.exit(1)

    if args.file_json:
        fetch_file_json(FILE_KEY)

    if args.nodes:
        node_ids = parse_node_list(args.nodes)
        fetch_nodes(FILE_KEY, node_ids)

    if args.images:
        node_ids = parse_node_list(args.images)
        export_images(FILE_KEY, node_ids, fmt=args.format, scale=args.scale)


if __name__ == "__main__":
    main()
