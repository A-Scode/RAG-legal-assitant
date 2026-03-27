from rest_framework import generics , viewsets
from rest_framework.permissions import IsAuthenticated , AllowAny
from .models import User , ChatSession , ChatMessage , Document , DocumentRefered , OTP
from .serializers import UserSerializer , RegisterSerializer , LoginSerializer , ProfileUpdateSerializer , GetOTPSerializer, ChatSessionSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema


class UserProfileView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @extend_schema(request=ProfileUpdateSerializer, responses=UserSerializer)
    def post(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(self.get_serializer(request.user).data)
        


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class GetOTPView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = GetOTPSerializer
    queryset = OTP.objects.all()

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        otp_data = serializer.save()
        return Response(otp_data)


class LoginView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token = serializer.validated_data['token']
        refresh = serializer.validated_data['refresh']
        return Response({
            'user': UserSerializer(user).data,
            'token': token,
            'refresh': refresh,
        })


class ChatSessionViewSet(viewsets.ModelViewSet):
    queryset = ChatSession.objects.all().order_by("-created_at")
    permission_classes = [IsAuthenticated]
    serializer_class = ChatSessionSerializer
    
    
    
    
    
        