from django.urls import path
from django.http import JsonResponse
from . import views

def health_check(request):
    return JsonResponse({'status': 'ok', 'service': 'personal-vault-api'})

urlpatterns = [
    # Health check
    path('', health_check, name='index'),
    path('health/', health_check, name='health'),

    # TOTP Authentication
    path('api/auth/verify/', views.auth_verify_view, name='auth_verify'),
    path('api/auth/status/', views.auth_status_view, name='auth_status'),

    # File Management API
    path('api/files/', views.file_list_view, name='file_list'),
    path('api/files/upload/', views.file_upload_view, name='file_upload'),
    path('api/files/rename/', views.file_rename_view, name='file_rename'),
    path('api/files/delete/', views.file_delete_view, name='file_delete'),
    path('api/stats/', views.vault_stats_view, name='vault_stats'),

    # Direct File Serving
    path('public/<path:filepath>', views.serve_public_file_view, name='serve_public'),
    path('protected/<path:filepath>', views.serve_protected_file_view, name='serve_protected'),
]
