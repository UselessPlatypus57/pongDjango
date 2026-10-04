import json
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_http_methods
from .models import Score

# Create your views here.

def game(requests):
    return render(requests, "pong/game.html")

@require_http_methods(["GET", "POST"])

def scores(requests):
    if requests.method == "POST":
        try:
            data = json.loads(requests.body)
            Score.objects.create(
                player_name=str(data["player_name"])[:20] or "Anonymous",
                player_score=int(data["player_score"]),
                ai_score=int(data["ai_score"]),
            )
        except (KeyError, ValueError, TypeError):
            return JsonResponse({"error": "Invalid data"}, status=400)
        return JsonResponse({"ok": True}, status=201)

    top = Score.objects.all()[:10]
    return JsonResponse({"scores": [
        {"name": s.player_name, "player": s.player_score, "ai": s.ai_score}
        for s in top
    ]})
