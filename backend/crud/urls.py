from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/songs/', include('api.urls')),  # Existing song API
    path('api/transpose/', include('transpose.urls')),  # New transposition API
    path('api/auth/', include('authentication.urls')),
    path('api/guitartabs/', include('guitartabs.urls')),
]
