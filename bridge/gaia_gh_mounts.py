"""GAIA native GitHub CLI mounts; invoked only by an authenticated localhost bridge.

A mount is a private host directory with a .mount.json registry and real gh clones
under repos/. A website link is metadata only and never becomes a filesystem clone.
No browser-provided shell command, paths, Git flags, credentials, or arbitrary host.
"""
import asyncio
import json
import os
import re
import tempfile
from pathlib import Path
from urllib.parse import urlsplit

MOUNT_RE = re.compile(r"^[a-z][a-z0-9-]{0,39}$")
REPO_RE = re.compile(r"^([A-Za-z0-9][A-Za-z0-9_.-]{0,38})/([A-Za-z0-9][A-Za-z0-9_.-]{0,99})$")
DEFAULT_ROOT = Path.home() / "Æ" / "mounts"
LOCK = asyncio.Lock()

def validate_mount(value):
    if not isinstance(value, str) or not MOUNT_RE.fullmatch(value):
        raise ValueError("Mount must be 1-40 lowercase letters, numbers or hyphens")
    return value

def validate_repo(value):
    if not isinstance(value, str):
        raise ValueError("Repository must be OWNER/REPO")
    match = REPO_RE.fullmatch(value)
    if not match or any(piece in (".", "..") or piece.startswith("-") for piece in match.groups()):
        raise ValueError("Repository must be a GitHub OWNER/REPO identifier")
    return match.group(1) + "/" + match.group(2)

def validate_site_url(value):
    if not isinstance(value, str) or len(value) > 1024:
        raise ValueError("Expected an HTTPS URL")
    u = urlsplit(value)
    if u.scheme != "https" or not u.hostname or u.username or u.password or u.fragment:
        raise ValueError("Only HTTPS site links without embedded credentials are allowed")
    if u.hostname.lower() in ("localhost", "127.0.0.1", "::1") or u.hostname.endswith(".local"):
        raise ValueError("Site link must not reference a loopback endpoint")
    return value

def ensure_dir(path):
    if path.is_symlink():
        raise ValueError("Symbolic link mount directories are prohibited")
    path.mkdir(mode=0o700, parents=True, exist_ok=True)
    if path.is_symlink() or not path.is_dir():
        raise ValueError("Mount directory invalid")
    os.chmod(path, 0o700)
    return path

def mount_path(name, root=None):
    name = validate_mount(name)
    base = Path(root) if root is not None else DEFAULT_ROOT
    ensure_dir(base)
    return ensure_dir(base / name)

def load_mount(directory):
    meta = directory / ".mount.json"
    if not meta.exists():
        return {"version": 1, "mount": directory.name, "webUrl": None, "repositories": []}
    if meta.is_symlink() or not meta.is_file():
        raise ValueError("Invalid mount registry")
    data = json.loads(meta.read_text(encoding="utf-8"))
    if data.get("mount") != directory.name or not isinstance(data.get("repositories"), list):
        raise ValueError("Corrupted mount registry")
    return data

def store_mount(directory, data):
    fd, tmp = tempfile.mkstemp(prefix=".mount-staged-", dir=directory)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as file:
            json.dump(data, file, ensure_ascii=False, indent=2, sort_keys=True)
            file.write("\n")
            file.flush()
            os.fsync(file.fileno())
        os.chmod(tmp, 0o600)
        os.replace(tmp, directory / ".mount.json")
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)

async def list_mounts(root=None):
    base = Path(root) if root is not None else DEFAULT_ROOT
    if not base.exists():
        return []
    if base.is_symlink():
        raise ValueError("Symlink root not permitted")
    mounts = []
    for directory in sorted(base.iterdir()):
        if directory.is_symlink() or not directory.is_dir() or not MOUNT_RE.fullmatch(directory.name):
            continue
        data = load_mount(directory)
        actual = []
        for rec in data.get("repositories", []):
            if not isinstance(rec, dict):
                continue
            repo = rec.get("repository", "")
            try:
                normalized = validate_repo(repo)
            except ValueError:
                continue
            checkout = directory / "repos" / normalized.replace("/", "__")
            actual.append({"repository": normalized,
                           "status": "cloned" if (not checkout.is_symlink() and (checkout / ".git").exists()) else "missing",
                           "relativePath": "repos/" + normalized.replace("/", "__")})
        mounts.append({"mount": directory.name, "hostPath": str(directory),
                       "webUrl": data.get("webUrl"), "repositories": actual})
    return mounts

async def link_website(name, url, root=None):
    name, url = validate_mount(name), validate_site_url(url)
    async with LOCK:
        directory = mount_path(name, root)
        data = load_mount(directory)
        data["webUrl"] = url
        store_mount(directory, data)
        return {"mount": name, "webUrl": url, "kind": "external-link-only"}

async def clone_repo(name, repository, root=None, timeout_seconds=120):
    name, repository = validate_mount(name), validate_repo(repository)
    async with LOCK:
        directory = mount_path(name, root)
        repos = ensure_dir(directory / "repos")
        repo_dir = repos / repository.replace("/", "__")
        if repo_dir.is_symlink():
            raise ValueError("Repository destination cannot be a symlink")
        data = load_mount(directory)
        if repo_dir.exists():
            if not (repo_dir.is_dir() and (repo_dir / ".git").exists()):
                raise ValueError("An unrelated filesystem item already occupies the clone directory")
            if not any(r.get("repository") == repository for r in data["repositories"]):
                raise ValueError("Existing checkout is not registered; manual examination required")
            return {"mount": name, "repository": repository, "status": "already-cloned",
                    "hostPath": str(repo_dir)}
        # No shell, no arbitrary flags, no browser-chosen path. gh uses the
        # active GitHub identity of THIS LOCAL HOST, not the website's cookies.
        stage = repos / (".staging-" + os.urandom(8).hex())
        try:
            proc = await asyncio.create_subprocess_exec(
                "gh", "repo", "clone", repository, str(stage), "--", "--depth=1",
                stdout=asyncio.subprocess.DEVNULL,
                stderr=asyncio.subprocess.PIPE)
            try:
                _, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout_seconds)
            except asyncio.TimeoutError:
                proc.kill()
                await proc.communicate()
                raise RuntimeError("GitHub clone timed out")
            if proc.returncode:
                raise RuntimeError("GitHub clone failed; check gh auth status and repository access on the host")
            if not (stage / ".git").exists():
                raise RuntimeError("gh returned without a working checkout")
            os.rename(stage, repo_dir)
            data["repositories"].append({"repository": repository, "kind": "gh-cli-clone",
                                         "relativePath": "repos/" + repository.replace("/", "__")})
            store_mount(directory, data)
            return {"mount": name, "repository": repository, "status": "cloned",
                    "hostPath": str(repo_dir)}
        finally:
            # A failed staging tree is never exposed as a completed mount.
            if stage.exists():
                import shutil
                shutil.rmtree(stage, ignore_errors=True)
