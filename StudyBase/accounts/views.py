import os
import random
import requests as http_requests
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.views import APIView
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import LoginSerializer, RegisterSerializer
from .models import User, CreditWallet, EmailOTP


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer


class SendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data if isinstance(request.data, dict) else {}
        raw_email = data.get("email", "")
        email = raw_email.strip().lower() if isinstance(raw_email, str) else ""

        if not email or "@" not in email:
            print(f"❌ [SendOTPView 400] Missing or invalid email in request payload: '{raw_email}'")
            return Response(
                {"detail": "Please enter a valid email address."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user with this email already exists
        if User.objects.filter(email__iexact=email).exists():
            print(f"⚠️ [SendOTPView 400] Account already exists for email: '{email}'")
            return Response(
                {"detail": "An account with this email address already exists. Please sign in."},
                status=status.HTTP_400_BAD_REQUEST
            )

        otp_code = f"{random.randint(100000, 999999)}"
        EmailOTP.objects.create(email=email, otp=otp_code)

        # Send Email
        subject = "StudySpace.AI — Verification Code"
        message = f"Your verification code is: {otp_code}\n\nThis code will expire in 10 minutes."
        html_message = f"""
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #1C1917; max-width: 500px; margin: 0 auto; border: 1px solid #E6E0D6; border-radius: 16px;">
          <h2 style="color: #0D9488; margin-bottom: 12px;">StudyBase.AI Verification</h2>
          <p style="font-size: 14px; color: #78716C;">Use the 6-digit code below to complete your account registration:</p>
          <div style="background-color: #FAF7F2; padding: 18px; border-radius: 12px; font-size: 28px; font-weight: bold; letter-spacing: 6px; text-align: center; color: #0D9488; margin: 24px 0; border: 1px solid #E6E0D6;">
            {otp_code}
          </div>
          <p style="font-size: 12px; color: #78716C;">This code expires in 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
        """

        try:
            from_email = getattr(settings, "EMAIL_HOST_USER", None) or getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@studybase.ai")
            send_mail(
                subject,
                message,
                from_email,
                [email],
                html_message=html_message,
                fail_silently=False
            )
            print(f"✅ OTP email sent to {email}")
        except Exception as e:
            print(f"⚠️ Failed to send OTP email via SMTP: {e}")
            print("=" * 60)
            print(f"[OTP DEV FALLBACK] Target Email: {email} | Generated OTP: {otp_code}")
            print("=" * 60)

        return Response(
            {"detail": f"Verification code sent to {email}"},
            status=status.HTTP_200_OK
        )


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        name = request.data.get("name", "").strip()
        email = request.data.get("email", "").strip()
        password = request.data.get("password", "").strip()
        otp = request.data.get("otp", "").strip()

        if not name or not email or not password or not otp:
            return Response(
                {"detail": "Name, email, password, and 6-digit verification code are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(email__iexact=email).exists():
            return Response(
                {"detail": "An account with this email address already exists. Please sign in."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify OTP
        otp_record = EmailOTP.objects.filter(email__iexact=email).order_by('-created_at').first()
        if not otp_record or not otp_record.is_valid() or otp_record.otp != otp:
            return Response(
                {"detail": "Invalid or expired verification code. Please request a new code."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Mark OTP as verified
        otp_record.is_verified = True
        otp_record.save(update_fields=['is_verified'])

        # Create User & Provision 500 Credits
        user = User.objects.create_user(name=name, email=email, password=password)
        CreditWallet.objects.get_or_create(user=user, defaults={"balance": 500})

        # Generate SimpleJWT token
        refresh = RefreshToken.for_user(user)

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "name": user.name,
                "email": user.email,
            }
        }, status=status.HTTP_201_CREATED)


class GoogleAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("token") or request.data.get("credential")
        access_token = request.data.get("access_token")
        code = request.data.get("code")

        print(f"DEBUG GoogleAuthView: token={bool(token)}, access_token={bool(access_token)}, code={bool(code)}")

        if not token and not access_token and not code:
            return Response(
                {"detail": "Google authentication token or code is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        client_id = getattr(settings, "GOOGLE_CLIENT_ID", None) or os.getenv("AUTH_CLINT_ID") or os.getenv("AUTH_CLIENT_ID")
        client_secret = getattr(settings, "GOOGLE_CLIENT_SECRET", None) or os.getenv("AUTH_CLINT_SECRET") or os.getenv("AUTH_CLIENT_SECRET")
        email = None
        name = None

        # Method A: Exchange Auth Code if 'code' is provided
        if code:
            try:
                token_resp = http_requests.post(
                    "https://oauth2.googleapis.com/token",
                    data={
                        "code": code,
                        "client_id": client_id,
                        "client_secret": client_secret,
                        "redirect_uri": "postmessage",
                        "grant_type": "authorization_code",
                    },
                    timeout=10
                )
                print(f"DEBUG auth_code exchange status={token_resp.status_code}")
                if token_resp.status_code == 200:
                    token_data = token_resp.json()
                    access_token = token_data.get("access_token")
                    token = token_data.get("id_token")
                else:
                    print(f"DEBUG auth_code exchange failed: {token_resp.text}")
            except Exception as e:
                print(f"DEBUG auth_code exchange exception: {e}")

        # Method B: Verify ID token if provided
        if token:
            try:
                id_info = id_token.verify_oauth2_token(
                    token,
                    google_requests.Request(),
                    client_id
                )
                email = id_info.get("email")
                name = id_info.get("name") or id_info.get("given_name") or (email.split("@")[0] if email else None)
                print(f"DEBUG ID token verified successfully for email={email}")
            except Exception as e:
                print(f"DEBUG ID token verify error: {e}")

        # Method C: Fetch UserInfo using Access Token
        if not email and access_token:
            try:
                resp = http_requests.get(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    headers={"Authorization": f"Bearer {access_token}"},
                    timeout=10
                )
                print(f"DEBUG UserInfo status={resp.status_code}")
                if resp.status_code == 200:
                    user_data = resp.json()
                    email = user_data.get("email")
                    name = user_data.get("name") or user_data.get("given_name") or (email.split("@")[0] if email else None)
                else:
                    print(f"DEBUG UserInfo failed: {resp.text}")
            except Exception as e:
                print(f"DEBUG UserInfo exception: {e}")

        if not email:
            return Response(
                {"detail": "Invalid or expired Google authentication token."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get or create user
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            user = User.objects.create_user(
                email=email,
                name=name or email.split("@")[0],
                password=User.objects.make_random_password()
            )
            CreditWallet.objects.get_or_create(user=user, defaults={"balance": 500})
        else:
            CreditWallet.objects.get_or_create(user=user, defaults={"balance": 500})

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "name": user.name,
                "email": user.email,
            }
        }, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile(request):
    user = request.user
    wallet, _ = CreditWallet.objects.get_or_create(user=user, defaults={"balance": 500})
    return Response({
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "wallet": wallet.balance,
    })
