from rest_framework.decorators import api_view
from rest_framework.response import Response
from api.models import Song
import re

MAJOR_KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
MINOR_KEYS = [k + "m" for k in MAJOR_KEYS]

def is_minor_key(k: str) -> bool:
    return k.strip().endswith("m")

def normalize_key(k: str) -> str:
    if not k:
        return ""
    k = k.strip()
    m = k.endswith("m")
    r = k[:-1] if m else k
    if len(r) == 2 and r[1] in ("b", "#"):
        r = r[0].upper() + r[1]
    else:
        r = r.capitalize()
    flats = {"Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#"}
    r = flats.get(r, r)
    return r + ("m" if m else "")

def parse_chord(c: str):
    if not c:
        return {"leading": "", "root": "", "is_minor": False, "suffix": ""}
    m = re.match(r'^[^A-Ga-g#b]+', c)
    lead = m.group(0) if m else ""
    main = c[len(lead):]
    chord_min = main.endswith("m")
    if chord_min:
        main = main[:-1]
    rt = main[:2]
    sx = main[2:]
    if len(rt) == 2 and rt[1] not in ("#", "b"):
        rt = rt[0]
        sx = main[1:]
    return {"leading": lead, "root": rt, "is_minor": chord_min, "suffix": sx}

def transpose_chord(ch: str, semitones: int) -> str:
    p = parse_chord(ch)
    if not p["root"]:
        return ch
    nr = normalize_key(p["root"])
    base = nr.rstrip("m")
    all_notes = MAJOR_KEYS if not p["is_minor"] else MINOR_KEYS
    if nr not in all_notes and not p["is_minor"]:
        base = normalize_key(p["root"]).rstrip("m")
        if base not in MAJOR_KEYS:
            return ch
        i = MAJOR_KEYS.index(base)
        ni = (i + semitones) % 12
        newr = MAJOR_KEYS[ni]
    elif nr not in all_notes and p["is_minor"]:
        base = normalize_key(p["root"]).rstrip("m")
        if base not in MAJOR_KEYS:
            return ch
        i = MAJOR_KEYS.index(base)
        ni = (i + semitones) % 12
        newr = MAJOR_KEYS[ni] + "m"
    else:
        i = all_notes.index(nr)
        ni = (i + semitones) % 12
        newr = all_notes[ni]
    return f"{p['leading']}{newr}{p['suffix']}"

def check_mode_constraint(ok: str, tk: str):
    if not ok or not tk:
        return {"error": "Keys missing or invalid"}
    o_m = is_minor_key(ok)
    t_m = is_minor_key(tk)
    if o_m != t_m:
        return {"error": f"Mode mismatch: cannot transpose from {'minor' if o_m else 'major'} to {'minor' if t_m else 'major'}"}

def find_next_key(original_key: str, steps: int) -> str:
    minor = is_minor_key(original_key)
    arr = MINOR_KEYS if minor else MAJOR_KEYS
    k = normalize_key(original_key)
    if k not in arr:
        return MINOR_KEYS[0] if minor else MAJOR_KEYS[0]
    i = arr.index(k)
    return arr[(i + steps) % 12]

@api_view(["POST"])
def transpose_song(request, song_id):
    try:
        song = Song.objects.get(id=song_id)
    except Song.DoesNotExist:
        return Response({"error": f"Song with ID {song_id} not found"}, status=404)
    direction = request.data.get("direction")
    target_key = request.data.get("target_key")
    original_key = song.key or ""
    if not original_key:
        return Response({"error": "Original song key is invalid"}, status=400)
    steps = 0
    if direction == "up":
        steps = 1
    elif direction == "down":
        steps = -1
    if target_key:
        e = check_mode_constraint(original_key, target_key)
        if e:
            return Response(e, status=400)
        lines = []
        semitones = 0
        ok = normalize_key(original_key)
        tk = normalize_key(target_key)
        if not is_minor_key(ok):
            o_idx = MAJOR_KEYS.index(ok)
            t_idx = MAJOR_KEYS.index(tk)
            semitones = t_idx - o_idx
        else:
            o_idx = MINOR_KEYS.index(ok)
            t_idx = MINOR_KEYS.index(tk)
            semitones = t_idx - o_idx
        for line in song.lyrics:
            new_chords = []
            for c in line.get("chords", []):
                new_chords.append({
                    "chord": transpose_chord(c.get("chord", ""), semitones),
                    "position": c.get("position", 0)
                })
            lines.append({"text": line.get("text", ""), "chords": new_chords})
        return Response({
            "title": song.title,
            "artist": song.artist,
            "original_key": song.key,
            "transposed_key": target_key,
            "transposed_lyrics": lines
        })
    if steps != 0:
        new_k = find_next_key(original_key, steps)
        lines = []
        ok = normalize_key(original_key)
        nk = normalize_key(new_k)
        if not is_minor_key(ok):
            s = MAJOR_KEYS.index(nk) - MAJOR_KEYS.index(ok)
        else:
            s = MINOR_KEYS.index(nk) - MINOR_KEYS.index(ok)
        for line in song.lyrics:
            new_chords = []
            for c in line.get("chords", []):
                new_chords.append({
                    "chord": transpose_chord(c.get("chord", ""), s),
                    "position": c.get("position", 0)
                })
            lines.append({"text": line.get("text", ""), "chords": new_chords})
        return Response({
            "title": song.title,
            "artist": song.artist,
            "original_key": song.key,
            "transposed_key": new_k,
            "transposed_lyrics": lines
        })
    return Response({
        "title": song.title,
        "artist": song.artist,
        "original_key": song.key,
        "transposed_key": song.key,
        "transposed_lyrics": song.lyrics
    })
