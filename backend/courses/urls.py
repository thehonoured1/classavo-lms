from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, ChapterViewSet, get_me

# 1. Create a router and register our ViewSets
router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'chapters', ChapterViewSet, basename='chapter')

# 2. The API URLs are now determined automatically by the router
urlpatterns = [
    path('', include(router.urls)),
    path('me/', get_me, name='get_me'),
]