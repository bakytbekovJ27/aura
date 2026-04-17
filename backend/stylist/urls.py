from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('wardrobe', views.WardrobeViewSet, basename='wardrobe')
router.register('chat-sessions', views.ChatSessionViewSet, basename='chat-sessions')
router.register('recommendations', views.AIRecommendationViewSet, basename='recommendations')

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('dashboard/', views.dashboard,              name='dashboard'),
    path('', include(router.urls)),
]
