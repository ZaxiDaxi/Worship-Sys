# songs/management/commands/populate_songs.py
from django.core.management.base import BaseCommand
from songs.models import Song

class Command(BaseCommand):
    help = 'Populates the database with initial song data'

    def handle(self, *args, **options):
        # Clear existing songs
        Song.objects.all().delete()
        
        # Initial song data
        songs = [
            {
                'title': 'ព្រះយេស៊ូ',
                'artist': 'LIFE Band',
                'imageUrl': 'https://via.placeholder.com/50',
                'key': 'Em',
                'tempo': '86 BPM',
                'timeSignature': '4/4',
            },
            {
                'title': 'Perfect',
                'artist': 'Ed Sheeran',
                'imageUrl': 'https://via.placeholder.com/50',
                'key': 'Ab',
                'tempo': '93 BPM',
                'timeSignature': '4/4',
            },
            {
                'title': 'Let It Be',
                'artist': 'The Beatles',
                'imageUrl': 'https://via.placeholder.com/50',
                'key': 'C',
                'tempo': '72 BPM',
                'timeSignature': '4/4',
            },
            {
                'title': 'Hotel California',
                'artist': 'Eagles',
                'imageUrl': 'https://via.placeholder.com/50',
                'key': 'Bm',
                'tempo': '75 BPM',
                'timeSignature': '4/4',
            },
        ]
        
        for song_data in songs:
            Song.objects.create(**song_data)
            
        self.stdout.write(self.style.SUCCESS('Successfully populated song data'))