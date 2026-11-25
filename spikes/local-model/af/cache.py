"""Flush and advise away experiment file pages without touching host-wide caches."""

import os
from pathlib import Path
import sys

for name in sys.argv[1:]:
    root = Path(name)
    if not root.exists():
        continue
    candidates = root.rglob("*") if root.is_dir() else [root]
    for path in candidates:
        if not path.is_file():
            continue
        with path.open("rb") as file:
            os.fsync(file.fileno())
            os.posix_fadvise(file.fileno(), 0, 0, os.POSIX_FADV_DONTNEED)
