from django.db import models

class GuitarTab(models.Model):
    title = models.CharField(max_length=200)
    artist = models.CharField(max_length=200)
    imageUrl = models.URLField(blank=True, null=True)
    
    # New fields added
    key = models.CharField(max_length=10, blank=True, null=True)
    tempo = models.CharField(max_length=20, blank=True, null=True)
    
    # Existing tab data field
    tab_data = models.JSONField(default=dict, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Versioning approach, similar to your Song model
    version = models.IntegerField(default=1)
    original_tab = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="versions",
    )

    def save(self, *args, **kwargs):
        if self.artist:
            self.artist = self.artist.strip().title()
        if self.key:
            self.key = self.key.strip().capitalize()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} (v{self.version})"
