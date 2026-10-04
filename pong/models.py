from django.db import models

# Create your models here.
class Score(models.Model):
    player_name = models.CharField(max_length=20)
    player_score = models.PositiveSmallIntegerField()
    ai_score = models.PositiveSmallIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-player_score", "ai_score", "-created_at"]