from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# ── Custom Admin Branding ──
admin.site.site_header  = '✨ AURA — Панель управления'
admin.site.site_title   = 'AURA Admin'
admin.site.index_title  = 'Добро пожаловать в AURA'

urlpatterns = [
    path('admin/', admin.site.urls),

    # JWT auth
    path('api/auth/token/',         TokenObtainPairView.as_view(),  name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(),     name='token_refresh'),

    # App API
    path('api/', include('stylist.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
