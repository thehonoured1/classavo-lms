from django.db import models
from django.contrib.auth.models import User #Django's user system
# Create your models here.

# --- 1. THE ROLES: Student vs Instructor ---
class UserProfile(models.Model):
    # This attaches extra data to Django's built-in User system
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    is_instructor = models.BooleanField(default=False)

    def __str__(self):
        role = "Instructor" if self.is_instructor else "Student"
        return f"{self.user.username} ({role})"

# --- Course and Chapter models here:

class Course(models.Model):
    title = models.CharField(max_length=255)

    is_public = models.BooleanField(default=True)
    # Adding a string representation makes debugging in the console much easier
    def __str__(self):
        return self.title

class Chapter(models.Model):
    # The Foreign Key linking back to Course
    course = models.ForeignKey(Course, related_name='chapters', on_delete=models.CASCADE)
    # related_name creates a "reverse lookup" in DJango. It means that later, when you have a Course object, you can simply call course.chapters.all() to instantly fetch every chapter attached to it.

    # The fields you correctly identified
    title = models.CharField(max_length=255)
    content = models.JSONField(default=dict)
    visibility = models.BooleanField(default=False) # False = private by default

    def __str__(self):
        return self.title

# --- 2. JOINING COURSES: The Enrollment Junction ---
class Enrollment(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrolled_students')
    date_joined = models.DateTimeField(auto_now_add=True)

    class Meta:
        # A student can only join a specific course once!
        unique_together = ('student', 'course') 


# --- 3. THE PROGRESS TRACKER: The Read Receipt Junction ---
class ChapterProgress(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progress')
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE)
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # A student can only complete a specific chapter once!
        unique_together = ('student', 'chapter')