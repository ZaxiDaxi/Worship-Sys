from django.db import models
from guitartabs.models import GuitarTab


class Song(models.Model):
    # ── existing fields ───────────────────────────────────────────────
    title = models.CharField(max_length=200)
    artist = models.CharField(max_length=200)
    imageUrl = models.URLField(blank=True, null=True)
    key = models.CharField(max_length=10, blank=True, null=True)
    tempo = models.CharField(max_length=20, blank=True, null=True)
    time_signature = models.CharField(max_length=10, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    lyrics = models.JSONField(default=list, blank=True, null=True)
    version = models.IntegerField(default=1)
    original_song = models.ForeignKey(
        'self', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='versions'
    )
    guitar_tab = models.ForeignKey(
        GuitarTab, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='songs'
    )

    def save(self, *args, **kwargs):
        if self.key:
            self.key = self.key.strip().capitalize()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} (v{self.version})"


# ─────────────────────────────────────────────────────────────────────
# NEW: holds flow text for each song *version*
class SongFlow(models.Model):
    """
    One-to-one with Song so each version can keep its own flow script.
    If you’d like multiple drafts per version, switch to ForeignKey.
    """
    song = models.OneToOneField(
        Song, on_delete=models.CASCADE, related_name="flow"
    )
    flow_notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        preview = (self.flow_notes[:40] + "…") if len(self.flow_notes) > 40 else self.flow_notes
        return f"Flow for «{self.song}»: {preview}"
