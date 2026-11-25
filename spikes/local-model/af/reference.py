"""Check AF token IDs and pooling against the maker's original PyTorch model."""

import json
import sys
from pathlib import Path

import torch
from torch.nn.functional import normalize
from transformers import AutoModel, AutoTokenizer

root = Path(sys.argv[1])
spec = json.loads((root / "probes.json").read_text())
torch.set_num_threads(1)
model = AutoModel.from_pretrained(root / "reference", local_files_only=True, dtype=torch.float32)
tokenizer = AutoTokenizer.from_pretrained(root / "reference", local_files_only=True)
model.eval()
results = []
with torch.inference_mode():
    for text in spec["probes"]:
        inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=128)
        hidden = model(**inputs).last_hidden_state
        vector = {
            "mean": lambda: hidden.mean(dim=1),
            "cls": lambda: hidden[:, 0],
            "last": lambda: hidden[:, -1],
        }[spec["pooling"]]()
        results.append({
            "ids": inputs["input_ids"][0].tolist(),
            "embedding": normalize(vector)[0].tolist(),
        })
(root / "reference.json").write_text(json.dumps(results))
