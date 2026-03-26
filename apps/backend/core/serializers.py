from rest_framework import serializers
from .models import User, OTP
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
import random

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'state', 'city', 'occupation', 'details']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    otp = serializers.CharField(write_only=True , help_text="6-digit-OTP-field")
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password' , 'otp']
    
    def create(self, validated_data):
        validated_data.pop('otp')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            password=validated_data['password']
        )
        return user
    
    def validate(self , attrs):
        otp = attrs.get('otp')
        if not otp:
            raise serializers.ValidationError("OTP is required")
        if len(otp) != 6:
            raise serializers.ValidationError("OTP must be 6 digits")

        valid_otp = OTP.objects.filter(otp=otp, otp_type="register", verified=False).first()
        
        if not valid_otp:
            raise serializers.ValidationError("Invalid OTP")
        
        if not valid_otp.is_valid():
            raise serializers.ValidationError("OTP has expired")
        
        valid_otp.verified = True
        valid_otp.save()
        
        return attrs
        


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, attrs):
        user = authenticate(username=attrs['username'], password=attrs['password'])
        if not user:
            raise serializers.ValidationError("Invalid credentials")
        if not user.is_active:
            raise serializers.ValidationError("User is not active")
        
        refresh = RefreshToken.for_user(user)
        return {
            'user': user,
            'token': str(refresh.access_token),
            'refresh': str(refresh),
        }

class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['state', 'city', 'occupation', 'details']

class GetOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp_type = serializers.ChoiceField(choices=["forget-password" , "register"])


    def validate(self , attrs):
        email = attrs.get('email')
        otp_type = attrs.get('otp_type')
        if not email:
            raise serializers.ValidationError("Email is required")
        if not otp_type or otp_type not in ["forget-password" , "register"]:
            raise serializers.ValidationError("OTP type is required or invalid")
        return attrs
    
    def create(self , attrs):
        otp = random.randint(100000, 999999)
        OTP.objects.create(
            otp=str(otp),
            email=attrs['email'],
            otp_type=attrs['otp_type']
        )
        return {
            "otp": otp,
            "email": attrs['email'],
            "otp_type": attrs['otp_type']
        }