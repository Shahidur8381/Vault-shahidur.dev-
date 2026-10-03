"""
URL configuration for vault_api project.
"""
from django.urls import path, include

urlpatterns = [
    path('', include('vault.urls')),
]
