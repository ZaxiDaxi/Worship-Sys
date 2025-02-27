from django.urls import path
from .views import get_songs, get_song_detail, create_song_version, create_song

urlpatterns = [
    path('', get_songs, name='get_songs'),
    path('<int:song_id>/', get_song_detail, name='get_song_detail'),
    path('<int:song_id>/new-version/', create_song_version, name='create_song_version'),
    path('create/', create_song, name='create_song'),
]
