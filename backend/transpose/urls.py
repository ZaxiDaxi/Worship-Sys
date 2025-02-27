from django.urls import path
from .views import transpose_song

urlpatterns = [
    path('<int:song_id>/', transpose_song, name='transpose_song'),
]
