import json
import os
from pathlib import Path
from django.conf import settings
from django.http import JsonResponse, FileResponse, Http404, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .auth import verify_totp, generate_auth_token, require_auth, is_authenticated
from .utils import (
    get_category_for_filename,
    sanitize_filename,
    get_vault_root,
    get_safe_destination_path,
    format_file_info,
    VALID_CATEGORIES,
)


@csrf_exempt
@require_http_methods(["POST"])
def auth_verify_view(request):
    """Verifies 6-digit TOTP code and returns JWT token."""
    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'error': 'Invalid JSON body'}, status=400)

    totp_code = str(data.get('totp_code', '')).strip()
    if not totp_code:
        return JsonResponse({'error': 'TOTP code is required'}, status=400)

    if not verify_totp(totp_code):
        return JsonResponse({'error': 'Invalid or expired TOTP code'}, status=401)

    token = generate_auth_token()
    return JsonResponse({
        'token': token,
        'message': 'TOTP authentication successful',
    })


@require_http_methods(["GET"])
def auth_status_view(request):
    """Checks whether client has a valid active token."""
    authenticated = is_authenticated(request)
    return JsonResponse({'authenticated': authenticated})


@require_http_methods(["GET"])
def file_list_view(request):
    """Lists files in the requested vault with category filtering and search."""
    vault = request.GET.get('vault', 'public').lower()
    if vault not in ['public', 'protected']:
        vault = 'public'

    # Protected vault requires TOTP authentication to browse
    if vault == 'protected' and not is_authenticated(request):
        return JsonResponse(
            {'error': 'Unauthorized. TOTP authentication required to view protected vault.'},
            status=401
        )

    category_filter = request.GET.get('category', 'all').lower()
    search_query = request.GET.get('search', '').lower().strip()

    vault_root = get_vault_root(vault)
    files = []

    # Traverse categories
    for cat in VALID_CATEGORIES:
        cat_dir = vault_root / cat
        if not cat_dir.exists():
            continue
        for file_path in cat_dir.iterdir():
            if file_path.is_file() and not file_path.name.startswith('.'):
                info = format_file_info(file_path, vault)
                if category_filter != 'all' and info['category'] != category_filter:
                    continue
                if search_query and search_query not in info['name'].lower():
                    continue
                files.append(info)

    # Sort newest modified first
    files.sort(key=lambda x: x['modified_at'], reverse=True)

    return JsonResponse({
        'vault': vault,
        'count': len(files),
        'files': files,
    })


@csrf_exempt
@require_http_methods(["POST"])
@require_auth
def file_upload_view(request):
    """Uploads a file to public or protected vault, categorizes into subfolder, with optional rename."""
    if 'file' not in request.FILES:
        return JsonResponse({'error': 'No file uploaded'}, status=400)

    uploaded_file = request.FILES['file']
    vault = request.POST.get('vault', 'public').lower()
    if vault not in ['public', 'protected']:
        vault = 'public'

    custom_name = request.POST.get('custom_name', '').strip()
    original_name = uploaded_file.name
    orig_ext = Path(original_name).suffix.lower()

    if custom_name:
        clean_custom = sanitize_filename(custom_name)
        # If user didn't provide extension in custom name, append original extension
        if not Path(clean_custom).suffix and orig_ext:
            target_name = f"{clean_custom}{orig_ext}"
        else:
            target_name = clean_custom
    else:
        target_name = sanitize_filename(original_name)

    # Automatically determine subfolder based on extension
    subfolder = get_category_for_filename(target_name)
    vault_root = get_vault_root(vault)
    subfolder_dir = vault_root / subfolder
    subfolder_dir.mkdir(parents=True, exist_ok=True)

    # Check for name collision and add suffix if needed
    name_stem = Path(target_name).stem
    ext = Path(target_name).suffix
    final_path = subfolder_dir / target_name
    counter = 1
    while final_path.exists():
        final_path = subfolder_dir / f"{name_stem}_{counter}{ext}"
        counter += 1

    # Write file in chunks to disk
    with open(final_path, 'wb+') as destination:
        for chunk in uploaded_file.chunks():
            destination.write(chunk)

    file_info = format_file_info(final_path, vault)
    return JsonResponse({
        'message': 'File uploaded successfully',
        'file': file_info,
    }, status=201)


@csrf_exempt
@require_http_methods(["POST"])
@require_auth
def file_rename_view(request):
    """Renames an existing file within a vault."""
    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'error': 'Invalid JSON body'}, status=400)

    vault = data.get('vault', 'public').lower()
    if vault not in ['public', 'protected']:
        vault = 'public'

    old_path = data.get('path', '').strip()
    new_name = data.get('new_name', '').strip()

    if not old_path or not new_name:
        return JsonResponse({'error': 'Both path and new_name are required'}, status=400)

    vault_root = get_vault_root(vault)
    src_file = (vault_root / old_path).resolve()

    if not src_file.exists() or not src_file.is_file():
        return JsonResponse({'error': 'Source file not found'}, status=404)

    if not str(src_file).startswith(str(vault_root.resolve())):
        return JsonResponse({'error': 'Invalid file path'}, status=400)

    clean_new_name = sanitize_filename(new_name)
    # If no extension was specified in new name, keep existing extension
    if not Path(clean_new_name).suffix and src_file.suffix:
        clean_new_name = f"{clean_new_name}{src_file.suffix}"

    # Recalculate subfolder if extension changed, or keep in current folder
    target_category = get_category_for_filename(clean_new_name)
    dst_dir = vault_root / target_category
    dst_dir.mkdir(parents=True, exist_ok=True)
    dst_file = dst_dir / clean_new_name

    if dst_file.exists() and dst_file != src_file:
        return JsonResponse({'error': f"A file named '{clean_new_name}' already exists in {target_category}"}, status=409)

    src_file.rename(dst_file)
    file_info = format_file_info(dst_file, vault)

    return JsonResponse({
        'message': 'File renamed successfully',
        'file': file_info,
    })


@csrf_exempt
@require_http_methods(["POST"])
@require_auth
def file_delete_view(request):
    """Deletes a file from public or protected vault."""
    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'error': 'Invalid JSON body'}, status=400)

    vault = data.get('vault', 'public').lower()
    if vault not in ['public', 'protected']:
        vault = 'public'

    rel_path = data.get('path', '').strip()
    if not rel_path:
        return JsonResponse({'error': 'File path is required'}, status=400)

    vault_root = get_vault_root(vault)
    target_file = (vault_root / rel_path).resolve()

    if not target_file.exists() or not target_file.is_file():
        return JsonResponse({'error': 'File not found'}, status=404)

    if not str(target_file).startswith(str(vault_root.resolve())):
        return JsonResponse({'error': 'Invalid file path'}, status=400)

    target_file.unlink()

    return JsonResponse({
        'message': 'File deleted successfully',
        'deleted_path': rel_path,
    })


@require_http_methods(["GET"])
def vault_stats_view(request):
    """Returns storage usage summary for public and protected vaults."""
    stats = {}
    for vault in ['public', 'protected']:
        vault_root = get_vault_root(vault)
        total_size = 0
        total_files = 0
        category_counts = {cat: 0 for cat in VALID_CATEGORIES}

        for cat in VALID_CATEGORIES:
            cat_dir = vault_root / cat
            if cat_dir.exists():
                for f in cat_dir.iterdir():
                    if f.is_file() and not f.name.startswith('.'):
                        total_files += 1
                        category_counts[cat] += 1
                        try:
                            total_size += f.stat().st_size
                        except Exception:
                            pass

        stats[vault] = {
            'total_files': total_files,
            'total_size_bytes': total_size,
            'categories': category_counts,
        }

    return JsonResponse(stats)


@require_http_methods(["GET", "HEAD"])
def serve_public_file_view(request, filepath):
    """
    Publicly serves any file inside public vault directly without auth.
    Supports embedding anywhere with CORS and Cache-Control headers.
    """
    public_root = get_vault_root('public')
    file_path = (public_root / filepath).resolve()

    # Security check: must reside inside public root
    if not str(file_path).startswith(str(public_root.resolve())):
        raise Http404("File not found")

    if not file_path.exists() or not file_path.is_file():
        raise Http404("File not found")

    response = FileResponse(open(file_path, 'rb'))
    # Set CORS headers so external websites can fetch or embed
    response['Access-Control-Allow-Origin'] = '*'
    response['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS'
    response['Cache-Control'] = 'public, max-age=86400, stale-while-revalidate=604800'
    response['Content-Disposition'] = f'inline; filename="{file_path.name}"'
    return response


@require_http_methods(["GET", "HEAD"])
def serve_protected_file_view(request, filepath):
    """
    Serves a protected file only if authorized by TOTP JWT token.
    Token can be passed in Authorization header or '?token=' query parameter.
    """
    if not is_authenticated(request):
        return JsonResponse({'error': 'Unauthorized. Protected file access requires TOTP token.'}, status=401)

    protected_root = get_vault_root('protected')
    file_path = (protected_root / filepath).resolve()

    if not str(file_path).startswith(str(protected_root.resolve())):
        raise Http404("File not found")

    if not file_path.exists() or not file_path.is_file():
        raise Http404("File not found")

    response = FileResponse(open(file_path, 'rb'))
    response['Cache-Control'] = 'private, no-cache, no-store, must-revalidate'
    response['Content-Disposition'] = f'inline; filename="{file_path.name}"'
    return response
