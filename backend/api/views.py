import re
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Song
from .serializers import SongSerializer

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def get_song_detail(request, song_id):
    try:
        song = Song.objects.get(id=song_id)
    except Song.DoesNotExist:
        return Response({"error": "Song not found"}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = SongSerializer(song)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    elif request.method in ['PUT', 'PATCH']:
        # Use partial update if the method is PATCH
        partial = request.method == 'PATCH'
        serializer = SongSerializer(song, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        song.delete()
        return Response(
            {"message": "Song deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
        )

@api_view(['GET'])
def get_songs(request):
    search = request.query_params.get('search', '').strip()
    
    # If a search query is provided, use a regex that matches a word boundary followed by the search term.
    if search:
        # Build a regex pattern that requires the search string to appear at a word boundary
        regex = r'\b' + re.escape(search)
        qs = Song.objects.filter(title__iregex=regex).order_by('id')
    else:
        qs = Song.objects.all().order_by('id')
    
    try:
        page = int(request.query_params.get('page', 1))
    except ValueError:
        page = 1
    try:
        page_size = int(request.query_params.get('page_size', 5))
    except ValueError:
        page_size = 5

    total = qs.count()
    start = (page - 1) * page_size
    end = start + page_size
    serializer = SongSerializer(qs[start:end], many=True)
    return Response({
        "total": total,
        "page": page,
        "page_size": page_size,
        "songs": serializer.data,
    }, status=status.HTTP_200_OK)




@api_view(['POST'])
def create_song_version(request, song_id):
    try:
        original_song = Song.objects.get(id=song_id)
    except Song.DoesNotExist:
        return Response({"error": "Song not found"}, status=status.HTTP_404_NOT_FOUND)
    data = request.data.copy()
    data["version"] = original_song.version + 1
    data["original_song"] = original_song.id
    serializer = SongSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def create_song(request):
    serializer = SongSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
