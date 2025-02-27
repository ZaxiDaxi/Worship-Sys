from django.urls import path
from .views import (
    list_guitartabs,
    create_guitartab,
    guitartab_detail,
)

urlpatterns = [
    path('', list_guitartabs, name='list_guitartabs'),
    path('create/', create_guitartab, name='create_guitartab'),
    path('<int:tab_id>/', guitartab_detail, name='guitartab_detail'),
]
