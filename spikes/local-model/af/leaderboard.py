"""Summarize the official MTEB Multilingual v2 score response."""

import json
import sys
from pathlib import Path

source = json.loads(Path(sys.argv[1]).read_text())
assert source["benchmarkName"] == "MTEB(Multilingual, v2)"
assert len(source["tasks"]) == 131
named = (
    "paraphrase-multilingual-minilm", "harrier-oss-v1-270m",
    "granite-embedding-97m-multilingual-r2", "granite-embedding-311m-multilingual-r2",
    "jina-embeddings-v5-text", "embeddinggemma-2", "tarka-embedding-350m",
)

print("model\tparameters_M\tMTEB_release_date\tmean_task_pct\ttask_count")
for row in source["rows"]:
    model = row["model"]
    name = model["name"]
    date = model["releaseDate"] or ""
    params = model["totalParamsB"] or float("inf")
    named_model = any(part in name.lower() for part in named)
    full_competitor = (
        date.startswith("2026") and params <= 0.35 and row["meanTask"] is not None
        and model["modelType"] == "dense" and "text" in model["modalities"]
    )
    if named_model or full_competitor:
        score = row["meanTask"]
        print(name, f"{params * 1000:g}", date, "-" if score is None else f"{score * 100:.2f}",
              len(row["scoresByTask"]), sep="\t")
