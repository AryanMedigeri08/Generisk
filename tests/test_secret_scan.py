import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from check_secrets import find_issues


class SecretScanTests(unittest.TestCase):
    def test_detects_token_without_printing_value(self) -> None:
        sample = "gh" + "p_" + "a" * 32
        self.assertEqual(find_issues(sample), ["credential-token-pattern"])

    def test_detects_private_key(self) -> None:
        sample = "-----BEGIN " + "PRIVATE KEY-----"
        self.assertIn("private-key-header", find_issues(sample))

    def test_rejects_non_placeholder_database_password(self) -> None:
        sample = "postgresql://user:" + "invented-example-value" + "@localhost/db"
        self.assertIn("non-placeholder-url-password", find_issues(sample))

    def test_accepts_explicit_local_placeholder(self) -> None:
        sample = "postgresql://amanah_demo:demo-local-only@127.0.0.1:15432/amanah_demo"
        self.assertEqual(find_issues(sample), [])


if __name__ == "__main__":
    unittest.main()
