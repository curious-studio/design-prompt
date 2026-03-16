# Figma integration

This repository includes a small helper to fetch data from a Figma file and export images.

Setup

1. Install dependencies:

```bash
python -m pip install -r requirements.txt
```

2. Provide credentials (choose one):
- Create a `.env` file (or export env vars) with `FIGMA_TOKEN` and `FIGMA_FILE_KEY`. See `.env.example`.

Usage examples

- Save full file JSON:

```bash
FIGMA_TOKEN=... FIGMA_FILE_KEY=... python scripts/figma_fetch.py --file-json
```

- Save nodes JSON:

```bash
FIGMA_TOKEN=... FIGMA_FILE_KEY=... python scripts/figma_fetch.py --nodes 1-2
```

- Export images for nodes:

```bash
FIGMA_TOKEN=... FIGMA_FILE_KEY=... python scripts/figma_fetch.py --images 1-2 --format png --scale 2
```

Outputs are written to `assets/figma/`.
