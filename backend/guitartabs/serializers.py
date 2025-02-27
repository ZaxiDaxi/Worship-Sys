from rest_framework import serializers
from .models import GuitarTab

class GuitarTabSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuitarTab
        fields = '__all__'
