from rest_framework import serializers
from .models import UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    # This will show the username instead of just the user id.
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'id',
            'user',
            'dob',
            'gender',
            'department',
            'nationality',
            'mobile',
            'address',
            'instrument',
            'team',
            'attendance'
        ]
