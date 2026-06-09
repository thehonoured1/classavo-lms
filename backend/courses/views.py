from rest_framework import viewsets
from .models import Course, Chapter,ChapterProgress, Enrollment
from .serializers import CourseSerializer, ChapterSerializer
from rest_framework.decorators import action
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q  

class CourseViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSerializer
    
    # 1. THE FILTER: Determine who gets to see what
    def get_queryset(self):
        user = self.request.user
        
        # If the user is an instructor (or superuser), show them EVERY course.
        if user.is_superuser or (hasattr(user, 'profile') and user.profile.is_instructor):
            return Course.objects.all()
            
        # If it's a student, only show courses that are PUBLIC -- OR -- courses they are already enrolled in!
        if user.is_authenticated:
            return Course.objects.filter(
                Q(is_public=True) | Q(enrolled_students__student=user)
            ).distinct()
            
        # If they aren't logged in at all, only show public courses
        return Course.objects.filter(is_public=True)

    # 2. THE BOUNCER: Secure the join endpoint just in case!
    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        course = self.get_object()
        
        if not request.user.is_authenticated:
            return Response({"detail": "You must be logged in to join."}, status=status.HTTP_401_UNAUTHORIZED)
            
        # --- NEW: Prevent joining private courses! ---
        if not course.is_public:
            # Only allow it if they somehow joined BEFORE it was made private
            if not Enrollment.objects.filter(student=request.user, course=course).exists():
                return Response({"detail": "This course is private and cannot be joined."}, status=status.HTTP_403_FORBIDDEN)

        enrollment, created = Enrollment.objects.get_or_create(
            student=request.user,
            course=course
        )
        
        if created:
            return Response({"detail": "Successfully joined the course!"}, status=status.HTTP_201_CREATED)
        else:
            return Response({"detail": "You are already enrolled."}, status=status.HTTP_200_OK)


class ChapterViewSet(viewsets.ModelViewSet):
    serializer_class = ChapterSerializer
    queryset = Chapter.objects.all()

    # This method runs whenever someone fetches a single chapter (e.g., /api/chapters/5/)
    def retrieve(self, request, *args, **kwargs):
        # 1. Get the actual chapter they are asking for
        chapter_instance = self.get_object()

        # 2. AUTO-COMPLETE LOGIC:
        # If the person asking is a logged-in user, create a progress record!
        # get_or_create ensures we don't accidentally create duplicates if they refresh the page.
        if request.user.is_authenticated:
            ChapterProgress.objects.get_or_create(
                student=request.user, 
                chapter=chapter_instance
            )

        # 3. Proceed as normal and hand over the JSON data to React
        serializer = self.get_serializer(chapter_instance)
        return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_me(request):
    # 1. If you logged in with the superuser account, you are automatically an instructor!
    if request.user.is_superuser:
        return Response({"username": request.user.username, "is_instructor": True})
        
    # 2. For normal users, safely check if they have an instructor profile
    is_instructor = False
    if hasattr(request.user, 'profile'):
        is_instructor = request.user.profile.is_instructor
        
    return Response({
        "username": request.user.username,
        "is_instructor": is_instructor
    })