# serializers.py
from rest_framework import serializers
from guitartabs.models import  GuitarTab  # Adjust import if GuitarTab is in another app
from .models import Song

class SongSerializer(serializers.ModelSerializer):
    """
    We create a separate guitar_tab_id field to allow front-end
    to send { guitar_tab_id: 123 } for attaching a GuitarTab.
    """
    guitar_tab_id = serializers.PrimaryKeyRelatedField(
        source='guitar_tab',
        queryset=GuitarTab.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Song
        fields = [
            'id',
            'title',
            'artist',
            'imageUrl',
            'key',
            'tempo',
            'timeSignature',
            'created_at',
            'lyrics',
            'version',
            'original_song',
            'guitar_tab_id',
        ]


class GuitarTabSerializer(serializers.ModelSerializer):
    """
    Assuming you also have a GuitarTab model & serializer in the same app.
    If not, you can remove/adjust as needed.
    """
    class Meta:
        model = GuitarTab
        fields = '__all__'
