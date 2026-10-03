import os
import re
import mimetypes
from pathlib import Path
from django.conf import settings

# Mapping of file extensions to subfolders
CATEGORY_EXTENSIONS = {
    'images': {
        '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
        '.bmp', '.ico', '.avif', '.tiff', '.tif', '.heic', '.heif'
    },
    'pdf': {
        '.pdf'
    },
    'video': {
        '.mp4', '.webm', '.mkv', '.avi', '.mov', '.flv',
        '.wmv', '.m4v', '.3gp', '.ogv'
    },
    'audio': {
        '.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac',
        '.wma', '.opus', '.mid', '.midi'
    }
}

VALID_CATEGORIES = ['images', 'pdf', 'video', 'audio', 'others']


def get_category_for_filename(filename: str) -> str:
    """Determines subfolder category based on file extension."""
    ext = Path(filename).suffix.lower()
    for cat, extensions in CATEGORY_EXTENSIONS.items():
        if ext in extensions:
            return cat
    return 'others'


def sanitize_filename(name: str) -> str:
    """Sanitizes filename removing dangerous characters and spaces."""
    name = Path(name).name  # strip any path prefix
    # Replace spaces with underscores, strip unwanted characters
    name = re.sub(r'[\s]+', '_', name)
    name = re.sub(r'[^a-zA-Z0-9_\.\-]', '', name)
    if not name or name == '.':
        name = 'unnamed_file'
    return name


def get_vault_root(vault: str) -> Path:
    """Returns the base path for a vault ('public' or 'protected')."""
    vault = 'public' if vault == 'public' else 'protected'
    base = Path(settings.VAULT_BASE_PATH) / vault
    base.mkdir(parents=True, exist_ok=True)
    for cat in VALID_CATEGORIES:
        (base / cat).mkdir(parents=True, exist_ok=True)
    return base


def get_safe_destination_path(vault: str, subfolder: str, filename: str) -> Path:
    """Ensures destination is within the vault root and prevents path traversal."""
    root = get_vault_root(vault)
    clean_subfolder = sanitize_filename(subfolder)
    clean_filename = sanitize_filename(filename)

    target_dir = (root / clean_subfolder).resolve()
    # Security check: must reside inside root
    if not str(target_dir).startswith(str(root.resolve())):
        target_dir = root / 'others'

    target_path = (target_dir / clean_filename).resolve()
    if not str(target_path).startswith(str(root.resolve())):
        raise ValueError("Invalid target path traversal attempt")

    return target_path


def format_file_info(file_path: Path, vault: str, base_url: str = None) -> dict:
    """Constructs metadata dict for a stored file."""
    if base_url is None:
        base_url = settings.PUBLIC_BASE_URL.rstrip('/')

    vault_root = get_vault_root(vault)
    rel_path = file_path.relative_to(vault_root).as_posix()
    subfolder = rel_path.split('/')[0] if '/' in rel_path else 'others'
    filename = file_path.name
    category = get_category_for_filename(filename)

    try:
        stat = file_path.stat()
        size_bytes = stat.st_size
        modified_at = stat.st_mtime
    except Exception:
        size_bytes = 0
        modified_at = 0

    mime_type, _ = mimetypes.guess_type(str(file_path))
    if not mime_type:
        mime_type = 'application/octet-stream'

    # Direct URL
    if vault == 'public':
        direct_url = f"{base_url}/public/{rel_path}"
    else:
        direct_url = f"{base_url}/protected/{rel_path}"

    return {
        'name': filename,
        'path': rel_path,
        'category': category,
        'subfolder': subfolder,
        'vault': vault,
        'size_bytes': size_bytes,
        'size_formatted': format_bytes(size_bytes),
        'mime_type': mime_type,
        'modified_at': modified_at,
        'url': direct_url,
    }


def format_bytes(size: int) -> str:
    """Formats bytes to human readable format."""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size < 1024.0:
            return f"{size:.1f} {unit}" if unit != 'B' else f"{size} {unit}"
        size /= 1024.0
    return f"{size:.1f} PB"
