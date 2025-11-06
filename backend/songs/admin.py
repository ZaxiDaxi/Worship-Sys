from django.contrib import admin
from .models import Song
from .models import SongFlow


# Register your models here.
admin.site.register(Song)
admin.site.register(SongFlow)
