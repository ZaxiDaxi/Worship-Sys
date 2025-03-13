from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/songs/', include('api.urls')),  # Existing song API
    path('api/transpose/', include('transpose.urls')),  # New transposition API
    path('api/auth/', include('authentication.urls')),
    path('api/guitartabs/', include('guitartabs.urls')),
    path('api/profiles/', include('profiles.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
