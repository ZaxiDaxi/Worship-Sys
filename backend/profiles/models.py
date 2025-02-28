from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=[('Male', 'Male'), ('Female', 'Female')], null=True, blank=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    nationality = models.CharField(max_length=100, blank=True, null=True)

    mobile = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    instrument = models.CharField(max_length=50, blank=True, null=True)
    team = models.CharField(max_length=50, blank=True, null=True)
    attendance = models.CharField(max_length=10, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} Profile"
