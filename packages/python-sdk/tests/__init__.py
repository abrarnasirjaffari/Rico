"""Unit tests for rico-py."""

import sys
from pathlib import Path

_PACKAGE_ROOT = str(Path(__file__).resolve().parents[1])
if _PACKAGE_ROOT not in sys.path:
    sys.path.insert(0, _PACKAGE_ROOT)
