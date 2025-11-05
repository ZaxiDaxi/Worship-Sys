from rest_framework import serializers
from guitartabs.models import GuitarTab          # update if GuitarTab lives elsewhere
from .models import Song, SongFlow


class SongSerializer(serializers.ModelSerializer):
    """
    Exposes Song data plus a read/write ``flow_notes`` field that is stored
    in the related SongFlow object (one-to-one).
    """
    # handy alias so the front-end can send { guitar_tab_id: 123 }
    guitar_tab_id = serializers.PrimaryKeyRelatedField(
        source="guitar_tab",
        queryset=GuitarTab.objects.all(),
        required=False,
        allow_null=True,
    )

    # flow notes handled via helper methods below
    flow_notes = serializers.CharField(
        required=False, allow_blank=True, allow_null=True
    )

    class Meta:
        model = Song
        fields = [
            "id",
            "title",
            "artist",
            "imageUrl",
            "key",
            "tempo",
            "timeSignature",
            "created_at",
            "lyrics",
            "version",
            "original_song",
            "guitar_tab_id",
            "flow_notes",            # 👈 include in payload
        ]

    # ------------------------------------------------------------------
    # private helper
    # ------------------------------------------------------------------
    def _upsert_flow(self, song: Song, text: str | None) -> None:
        """Create or update the SongFlow row for *song*."""
        if text is None:
            return
        flow_obj, _ = SongFlow.objects.get_or_create(song=song)
        flow_obj.flow_notes = text
        flow_obj.save(update_fields=["flow_notes", "updated_at"])

    # ------------------------------------------------------------------
    # create / update overrides
    # ------------------------------------------------------------------
    def create(self, validated_data):
        flow_text = validated_data.pop("flow_notes", "")
        song = super().create(validated_data)
        self._upsert_flow(song, flow_text)
        return song

    def update(self, instance, validated_data):
        flow_text = validated_data.pop("flow_notes", None)
        song = super().update(instance, validated_data)
        if flow_text is not None:
            self._upsert_flow(song, flow_text)
        return song

    # ------------------------------------------------------------------
    # presentation
    # ------------------------------------------------------------------
    def to_representation(self, instance):
        """Inject ``flow_notes`` safely even when no SongFlow exists yet."""
        data = super().to_representation(instance)
        try:
            data["flow_notes"] = instance.flow.flow_notes
        except SongFlow.DoesNotExist:
            data["flow_notes"] = ""
        return data


class GuitarTabSerializer(serializers.ModelSerializer):
    """Unchanged helper serializer (keep if you still expose guitar-tab APIs)."""

    class Meta:
        model = GuitarTab
        fields = "__all__"
