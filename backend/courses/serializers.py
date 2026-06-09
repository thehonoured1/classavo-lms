from rest_framework import serializers
from .models import Course, Chapter

class ChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = ['id', 'title', 'content', 'course']

class CourseSerializer(serializers.ModelSerializer):

    # Here is the Nested Serializer!
    # many=True tells DRF to expect a list of chapters.
    # read_only=True ensures this is only used for sending data out, not saving new data in.
    chapters = ChapterSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = ['id', 'title', 'chapters', 'is_public'] # The chapters field is now included!