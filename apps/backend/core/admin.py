from django.contrib import admin
from .models import User , ChatSession , ChatMessage , Document , DocumentRefered , OTP
from unfold.admin import ModelAdmin , display

@admin.register(User)
class UserAdmin(ModelAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff')
    list_filter = ('is_staff', 'is_superuser', 'groups')
    search_fields = ('username', 'first_name', 'last_name', 'email')
    ordering = ('username',)

@admin.register(ChatSession)
class ChatSessionAdmin(ModelAdmin):
    list_display = ('session_id', 'user', 'title', 'created_at', 'updated_at')
    list_filter = ('user', 'created_at', 'updated_at')
    search_fields = ('session_id', 'user__username', 'title')
    ordering = ('-created_at',)

@admin.register(ChatMessage)
class ChatMessageAdmin(ModelAdmin):
    list_display = ('msg_id', 'session', 'role', 'content', 'created_at', 'updated_at')
    list_filter = ('session', 'role', 'created_at', 'updated_at')
    search_fields = ('msg_id', 'session__session_id', 'role', 'content')
    ordering = ('-created_at',)


@admin.register(Document)
class DocumentAdmin(ModelAdmin):
    list_display = ('doc_id', 'title', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('doc_id', 'title')
    ordering = ('-created_at',)

@admin.register(DocumentRefered)
class DocumentReferedAdmin(ModelAdmin):
    list_display = ("display_msg_id",'message', 'document')
    list_filter = ('message', 'document')
    search_fields = ('message', 'document')
    ordering = ('-message',)

    @display(description="Message id")
    def display_msg_id(self , obj):
        return obj.message.msg_id

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.order_by('message', '-id').distinct('message')

@admin.register(OTP)
class OTPAdmin(ModelAdmin):
    list_display = ('email', 'otp', 'otp_type', 'created_at', 'verified')
    list_filter = ('otp_type', 'created_at', 'verified')
    search_fields = ('email', 'otp')
    ordering = ('-created_at',)