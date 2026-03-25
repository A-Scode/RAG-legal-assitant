from rest_framework import generics
from rest_framework.permissions import IsAuthenticated , AllowAny
from .models import User , ChatSession , ChatMessage , Document , DocumentRefered
from .serializers import UserSerializer , RegisterSerializer , LoginSerializer , ProfileUpdateSerializer
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
    
    
        