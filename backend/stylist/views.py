import json
import os
from urllib import error, request as urllib_request

from django.contrib.auth.models import User
from django.db.models import Count
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import ACCESSORY_CATEGORIES, AIRecommendation, ChatMessage, ChatSession, UserProfile, WardrobeItem
from .serializers import (
    AIRecommendationSerializer,
    ChatMessageCreateSerializer,
    ChatMessageSerializer,
    ChatSessionSerializer,
    UserProfileSerializer,
    UserRegisterSerializer,
    WardrobeItemSerializer,
)


LEGACY_CATEGORY_MAP = {
    'top': 'shirt_long',
    'bottom': 'pants_classic',
    'dress': 'dress_casual',
    'outerwear': 'jacket',
    'shoes': 'sneakers',
    'bag': 'bag_daily',
    'accessory': 'accessory_jewelry',
    'sportswear': 'sports_set',
    'other': 'other',
}


def wardrobe_kind_queryset(queryset, kind):
    if kind == 'accessories':
        return queryset.filter(category__in=ACCESSORY_CATEGORIES)
    if kind == 'wardrobe':
        return queryset.exclude(category__in=ACCESSORY_CATEGORIES)
    return queryset


def summarize_items(items):
    if not items:
        return 'Пока вещей нет.'
    return '\n'.join(
        f'- {item.name}: {item.get_category_display()}, цвет {item.color or "не указан"}, бренд {item.brand or "не указан"}'
        for item in items[:20]
    )


def fallback_stylist_reply(user, content, wardrobe_items, accessory_items, history):
    lifestyle_bits = []
    profile = getattr(user, 'profile', None)
    if profile:
        if profile.occupation:
            lifestyle_bits.append(f'роль: {profile.occupation}')
        if profile.lifestyle:
            lifestyle_bits.append(f'ритм: {profile.lifestyle}')
        if profile.city_climate:
            lifestyle_bits.append(f'климат: {profile.city_climate}')

    tops = [item.get_category_display().lower() for item in wardrobe_items if item.category in {'shirt_short', 'shirt_long', 'tshirt', 'top', 'blouse', 'sweater', 'hoodie'}]
    bottoms = [item.get_category_display().lower() for item in wardrobe_items if item.category in {'jeans_ankle', 'jeans_full', 'pants_classic', 'pants_wide', 'skirt_mini', 'skirt_midi'}]
    layers = [item.get_category_display().lower() for item in wardrobe_items if item.category in {'jacket', 'blazer', 'coat', 'trench'}]
    shoes = [item.get_category_display().lower() for item in wardrobe_items if item.category in {'sneakers', 'heels', 'boots', 'loafers', 'sandals'}]
    accessories = [item.get_category_display().lower() for item in accessory_items]

    opening = 'Собрала для тебя простой и уместный образ по запросу.'
    if lifestyle_bits:
        opening += ' Учла ' + ', '.join(lifestyle_bits) + '.'

    lines = [opening]
    if tops:
        lines.append(f'Верх: начни с {tops[0]}.')
    if bottoms:
        lines.append(f'Низ: лучше всего подойдёт {bottoms[0]}.')
    if layers:
        lines.append(f'Третий слой: при необходимости добавь {layers[0]}.')
    if shoes:
        lines.append(f'Обувь: завершить образ можно через {shoes[0]}.')
    if accessories:
        lines.append(f'Из аксессуаров возьми {accessories[0]}, чтобы образ выглядел собранно.')
    if len(history) > 1:
        lines.append('Если хочешь, я могу сразу предложить ещё 2 альтернативы: более строго, более расслабленно или более уверенно для встречи.')
    else:
        lines.append('Если расскажешь формат встречи, погоду или желаемое впечатление, я уточню образ точнее.')
    return '\n\n'.join(lines)


def generate_stylist_reply(user, session, content):
    wardrobe_items = list(user.wardrobe_items.exclude(category__in=ACCESSORY_CATEGORIES)[:20])
    accessory_items = list(user.wardrobe_items.filter(category__in=ACCESSORY_CATEGORIES)[:12])
    history = list(session.messages.order_by('created_at').values('role', 'content')[:12])

    api_key = os.getenv('ANTHROPIC_API_KEY')
    if api_key:
        profile = getattr(user, 'profile', None)
        profile_summary = {
            'occupation': getattr(profile, 'occupation', ''),
            'lifestyle': getattr(profile, 'lifestyle', ''),
            'favorite_occasions': getattr(profile, 'favorite_occasions', ''),
            'city_climate': getattr(profile, 'city_climate', ''),
            'bio': getattr(profile, 'bio', ''),
        }
        system_prompt = (
            'Ты дружелюбный AI-стилист приложения AURA. '
            'Отвечай на русском. Давай практичные рекомендации по одежде, '
            'используя только вещи пользователя из контекста, если они подходят. '
            'Если вещей мало, честно скажи, чего не хватает. '
            'Формат ответа: 2-4 коротких абзаца без JSON и без markdown-таблиц.'
        )
        user_prompt = (
            f'Профиль пользователя: {json.dumps(profile_summary, ensure_ascii=False)}\n'
            f'Гардероб:\n{summarize_items(wardrobe_items)}\n\n'
            f'Аксессуары:\n{summarize_items(accessory_items)}\n\n'
            f'История диалога: {json.dumps(history, ensure_ascii=False)}\n\n'
            f'Новый запрос пользователя: {content}'
        )
        payload = json.dumps(
            {
                'model': 'claude-sonnet-4-20250514',
                'max_tokens': 700,
                'system': system_prompt,
                'messages': [{'role': 'user', 'content': user_prompt}],
            }
        ).encode('utf-8')
        req = urllib_request.Request(
            'https://api.anthropic.com/v1/messages',
            data=payload,
            headers={
                'Content-Type': 'application/json',
                'x-api-key': api_key,
                'anthropic-version': '2023-06-01',
            },
            method='POST',
        )
        try:
            with urllib_request.urlopen(req, timeout=25) as response:
                body = json.loads(response.read().decode('utf-8'))
            text_blocks = body.get('content') or []
            reply = '\n'.join(block.get('text', '') for block in text_blocks if block.get('type') == 'text').strip()
            if reply:
                return reply
        except (error.URLError, TimeoutError, ValueError, KeyError):
            pass

    return fallback_stylist_reply(user, content, wardrobe_items, accessory_items, history)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {'message': 'Аккаунт создан! Добро пожаловать в AURA ✨', 'username': user.username},
            status=status.HTTP_201_CREATED,
        )


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        profile, _ = UserProfile.objects.get_or_create(user=self.request.user)
        return profile


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    user = request.user
    profile, _ = UserProfile.objects.get_or_create(user=user)

    wardrobe_qs = user.wardrobe_items.exclude(category__in=ACCESSORY_CATEGORIES)
    accessory_qs = user.wardrobe_items.filter(category__in=ACCESSORY_CATEGORIES)
    recent_wardrobe = wardrobe_qs.order_by('-created_at')[:5]
    recent_chats = user.chat_sessions.order_by('-updated_at')[:4]

    return Response(
        {
            'profile': UserProfileSerializer(profile, context={'request': request}).data,
            'recent_wardrobe': WardrobeItemSerializer(recent_wardrobe, many=True, context={'request': request}).data,
            'recent_chats': ChatSessionSerializer(recent_chats, many=True).data,
            'stats': {
                'wardrobe_count': wardrobe_qs.count(),
                'accessories_count': accessory_qs.count(),
                'fav_count': user.wardrobe_items.filter(is_favorite=True).count(),
                'chats_count': user.chat_sessions.count(),
            },
        }
    )


class WardrobeViewSet(viewsets.ModelViewSet):
    serializer_class = WardrobeItemSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['category', 'season', 'is_favorite']
    search_fields = ['name', 'brand', 'color', 'notes']
    ordering_fields = ['created_at', 'times_worn']

    def get_queryset(self):
        queryset = WardrobeItem.objects.filter(user=self.request.user)
        kind = self.request.query_params.get('kind')
        queryset = wardrobe_kind_queryset(queryset, kind)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def toggle_favorite(self, request, pk=None):
        item = self.get_object()
        item.is_favorite = not item.is_favorite
        item.save()
        return Response({'is_favorite': item.is_favorite})

    @action(detail=True, methods=['post'])
    def worn(self, request, pk=None):
        item = self.get_object()
        item.times_worn += 1
        item.save()
        return Response({'times_worn': item.times_worn})

    @action(detail=False, methods=['get'])
    def stats(self, request):
        qs = self.get_queryset()
        by_category = list(qs.values('category').annotate(count=Count('id')).order_by('-count'))
        by_season = list(qs.values('season').annotate(count=Count('id')))
        return Response(
            {
                'total': qs.count(),
                'favorites': qs.filter(is_favorite=True).count(),
                'by_category': by_category,
                'by_season': by_season,
            }
        )


class ChatSessionViewSet(viewsets.ModelViewSet):
    serializer_class = ChatSessionSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete']

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user).prefetch_related('messages')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['get', 'post'], url_path='messages')
    def messages(self, request, pk=None):
        session = self.get_object()
        if request.method.lower() == 'get':
            data = ChatMessageSerializer(session.messages.order_by('created_at'), many=True).data
            return Response(data)

        serializer = ChatMessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        content = serializer.validated_data['content'].strip()
        if not content:
            return Response({'detail': 'Сообщение не может быть пустым'}, status=status.HTTP_400_BAD_REQUEST)

        user_message = ChatMessage.objects.create(session=session, role='user', content=content)
        if not session.title:
            session.title = content[:70]
        assistant_text = generate_stylist_reply(request.user, session, content)
        assistant_message = ChatMessage.objects.create(session=session, role='assistant', content=assistant_text)
        session.save(update_fields=['title', 'updated_at'])

        return Response(
            {
                'session': ChatSessionSerializer(session).data,
                'messages': ChatMessageSerializer([user_message, assistant_message], many=True).data,
            },
            status=status.HTTP_201_CREATED,
        )


class AIRecommendationViewSet(viewsets.ModelViewSet):
    serializer_class = AIRecommendationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['rec_type']
    ordering_fields = ['created_at']
    http_method_names = ['get', 'post', 'delete']

    def get_queryset(self):
        return AIRecommendation.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
