from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, CreditWallet

class LoginSerializer(TokenObtainPairSerializer):
    email = serializers.EmailField()

    @classmethod
    def get_token(cls, user):
        return super().get_token(user)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        user = authenticate(
            request=self.context.get("request"),
            email=attrs["email"],
            password=attrs["password"],
        )

        if not user:
            raise serializers.ValidationError({"detail": "Invalid Credentials"})

        refresh = self.get_token(user)
        
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh)
        }

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["name", "email", "password", "phone"]
        extra_kwargs = {
            "email": {"required": True},
            "name": {"required": True},
        }

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)

        CreditWallet.objects.create(
            user=user,
            balance=0
        )

        return user