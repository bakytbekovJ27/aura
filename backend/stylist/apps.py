from django.apps import AppConfig


class StylistConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'stylist'
    verbose_name = '✨ AURA Стилист'

    def ready(self):
        import stylist.signals  # noqa
