from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from .models import GuitarTab
from .serializers import GuitarTabSerializer

@api_view(['GET'])
def list_guitartabs(request):
    # Get search query and pagination parameters from the request
    search = request.query_params.get("search", "")
    try:
        page = int(request.query_params.get("page", 1))
    except ValueError:
        page = 1
    try:
        page_size = int(request.query_params.get("page_size", 5))
    except ValueError:
        page_size = 5

    # Filter by title or artist if a search query is provided
    if search:
        tabs_qs = GuitarTab.objects.filter(
            Q(title__icontains=search) | Q(artist__icontains=search)
        ).order_by('id')
    else:
        tabs_qs = GuitarTab.objects.all().order_by('id')

    # Calculate total count before paginating
    total = tabs_qs.count()

    # Apply pagination by slicing the queryset
    start = (page - 1) * page_size
    end = start + page_size
    tabs = tabs_qs[start:end]
    serializer = GuitarTabSerializer(tabs, many=True)
    
    # Return a JSON object with both the guitar tabs and total count
    return Response({"guitartabs": serializer.data, "total": total}, status=status.HTTP_200_OK)

@api_view(['POST'])
def create_guitartab(request):
    serializer = GuitarTabSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def guitartab_detail(request, tab_id):
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
