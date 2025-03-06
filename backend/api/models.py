# models.py
from django.db import models

# IMPORTANT: Update this import if your GuitarTab model lives in a different app
# e.g. from guitartabs.models import GuitarTab
from guitartabs.models import GuitarTab  # <-- or wherever your GuitarTab is defined


class Song(models.Model):
    title = models.CharField(max_length=200)
    artist = models.CharField(max_length=200)
    imageUrl = models.URLField(blank=True, null=True)
    key = models.CharField(max_length=10, blank=True, null=True)
    tempo = models.CharField(max_length=20, blank=True, null=True)
    timeSignature = models.CharField(max_length=10, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Existing lyrics fields
    lyrics = models.JSONField(default=list, blank=True, null=True)

    # Versioning
    version = models.IntegerField(default=1)
    original_song = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='versions'
    )

    # NEW FIELD: link to GuitarTab
    guitar_tab = models.ForeignKey(
        GuitarTab,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='songs'
    )

    def save(self, *args, **kwargs):
        # Optional logic to normalize the key text
        if self.key:
            self.key = self.key.strip().capitalize()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} (v{self.version})"
