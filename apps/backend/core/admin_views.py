from django.db.models import Count, Q
from django.utils import timezone
from django.views.generic import TemplateView
from django.contrib.admin.views.decorators import staff_member_required
from django.utils.decorators import method_decorator
from .models import User, ChatSession, ChatMessage, Document, OTP
from datetime import timedelta

from django.contrib import admin

@method_decorator(staff_member_required, name='dispatch')
class MonitorSystemActivityView(TemplateView):
    template_name = "admin/monitor_activity.html"

    def get_context_data(self, **kwargs):
        # Get standard admin context (sidebar, site title, etc.)
        context = admin.site.each_context(self.request)
        context.update(super().get_context_data(**kwargs))
        
        # Explicitly enable navigation sidebar for Unfold layout
        context.update({
            "is_nav_sidebar_enabled": True,
            "is_nav_sidebar_visible": True,
            "is_popup": False,
            "title": "Monitor System Activity",
            "subtitle": "System health and activity overview",
        })
        
        now = timezone.now()
        seven_days_ago = now - timedelta(days=7)

        # User statistics
        context['total_users'] = User.objects.count()
        context['staff_users'] = User.objects.filter(is_staff=True).count()
        context['new_users_7d'] = User.objects.filter(date_joined__gte=seven_days_ago).count()

        # Document statistics
        doc_stats = Document.objects.aggregate(
            total=Count('doc_id'),
            pending=Count('doc_id', filter=Q(embedding_status='pending')),
            embedding=Count('doc_id', filter=Q(embedding_status='embedding')),
            done=Count('doc_id', filter=Q(embedding_status='embedding_done')),
            failed=Count('doc_id', filter=Q(embedding_status='embedding_failed'))
        )
        context['doc_stats'] = doc_stats

        # Chat statistics
        context['total_sessions'] = ChatSession.objects.count()
        context['total_messages'] = ChatMessage.objects.count()
        
        # Recent activity data for charts (Last 7 days)
        daily_messages = []
        daily_labels = []
        for i in range(6, -1, -1):
            day = now - timedelta(days=i)
            count = ChatMessage.objects.filter(
                created_at__year=day.year,
                created_at__month=day.month,
                created_at__day=day.day
            ).count()
            daily_messages.append(count)
            daily_labels.append(day.strftime('%b %d'))

        context['chart_daily_messages'] = daily_messages
        context['chart_daily_labels'] = daily_labels

        # Top Users with Statistics
        top_users = User.objects.annotate(
            msg_count=Count('chatsession__chatmessage'),
            sess_count=Count('chatsession', distinct=True)
        ).order_by('-msg_count')[:10]

        user_statistics = []
        for user in top_users:
            user_daily_msgs = []
            for i in range(6, -1, -1):
                day = now - timedelta(days=i)
                count = ChatMessage.objects.filter(
                    session__user=user,
                    created_at__year=day.year,
                    created_at__month=day.month,
                    created_at__day=day.day
                ).count()
                user_daily_msgs.append(count)
            
            # Dynamic calculations for User Intelligence
            if user.msg_count > 50:
                engagement = "Elite"
            elif user.msg_count > 10:
                engagement = "Active"
            else:
                engagement = "Newbie"
            
            is_retained = "High" if user.last_login and user.last_login > now - timedelta(days=2) else "Moderate"
            
            user_statistics.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'msg_count': user.msg_count,
                'sess_count': user.sess_count,
                'last_login': user.last_login,
                'daily_history': user_daily_msgs,
                'engagement_level': engagement,
                'retention_status': is_retained
            })

        context['user_statistics'] = user_statistics

        # OTP Stats
        total_otps = OTP.objects.count()
        verified_otps = OTP.objects.filter(verified=True).count()
        context['total_otps'] = total_otps
        context['verified_otps'] = verified_otps
        context['otp_success_rate'] = round((verified_otps / total_otps * 100), 1) if total_otps > 0 else 0

        # Unfold Admin Sidebar/Breadcrumbs
        context.update({
            "title": "Monitor System Activity",
            "subtitle": "System health and activity overview",
        })

        return context
