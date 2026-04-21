from pathlib import Path
import re


CONF_PATH = Path("/etc/nginx/conf.d/default.conf")
DEFAULT_BLOCK = "    location / {\n        try_files $uri $uri/ /index.html;\n    }\n"
HOME_COMPAT_BLOCK = (
    "    location = /home {\n"
    "        return 301 /home/;\n"
    "    }\n\n"
    "    location ^~ /home/ {\n"
    "        rewrite ^/home/(.*)$ /$1 break;\n"
    "        try_files $uri $uri/ /index.html;\n"
    "    }\n\n"
)
OLD_HOME_BLOCK_PATTERN = re.compile(
    r"    location = / \{\n"
    r"        return 302 /home;\n"
    r"    \}\n\n"
    r"    location = /home \{\n"
    r"(?:        .*\n)+?"
    r"    \}\n\n"
    r"    location \^~ /home/ \{\n"
    r"(?:        .*\n)+?"
    r"    \}\n\n",
    re.MULTILINE,
)


def normalize_home_block(text: str) -> str:
    updated = OLD_HOME_BLOCK_PATTERN.sub("", text)

    if HOME_COMPAT_BLOCK in updated:
        return updated

    count = updated.count(DEFAULT_BLOCK)
    if count != 2:
        raise SystemExit(f"Unexpected default location block count: {count}")

    return updated.replace(DEFAULT_BLOCK, HOME_COMPAT_BLOCK + DEFAULT_BLOCK, 2)


def main() -> None:
    original = CONF_PATH.read_text(encoding="utf-8")
    updated = normalize_home_block(original)

    if updated == original:
        print("Nginx config already uses the normalized /home compatibility block.")
        return

    CONF_PATH.write_text(updated, encoding="utf-8")
    print("Normalized /home compatibility blocks in Nginx config.")


if __name__ == "__main__":
    main()
