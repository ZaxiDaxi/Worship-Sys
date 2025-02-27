from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import GuitarTab
from .serializers import GuitarTabSerializer

@api_view(['GET'])
def list_guitartabs(request):
    tabs = GuitarTab.objects.all().order_by('id')
    serializer = GuitarTabSerializer(tabs, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['POST'])
def create_guitartab(request):
    serializer = GuitarTabSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def guitartab_detail(request, tab_id):
    """
    Single endpoint that:
      - GET:  Retrieves a guitar tab
      - PUT/PATCH: Updates a guitar tab
      - DELETE: Removes a guitar tab
    """
    try:
        tab = GuitarTab.objects.get(id=tab_id)
    except GuitarTab.DoesNotExist:
        return Response({"error": "Guitar tab not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = GuitarTabSerializer(tab)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    elif request.method in ['PUT', 'PATCH']:
        partial = (request.method == 'PATCH')
        serializer = GuitarTabSerializer(tab, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        tab.delete()
        return Response({"message": "Guitar tab deleted"}, status=status.HTTP_204_NO_CONTENT)
