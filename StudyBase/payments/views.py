import json
import logging
import razorpay
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.conf import settings

from .services import client, add_credits
from .models import CreditOrders, CreditUsage

logger = logging.getLogger(__name__)


class OrderAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not settings.PAYMENT_ENABLED:
            return Response(
                {"message": "Payments are currently disabled by the system configuration."},
                status=403
            )

        amount = request.data.get("amount")

        if not amount:
            return Response({"message": "Amount is required"}, status=400)

        try:
            amount = int(amount)
            if amount <= 0:
                return Response({"message": "Amount must be a positive integer"}, status=400)
        except (ValueError, TypeError):
            return Response({"message": "Amount must be a valid integer"}, status=400)

        # Razorpay expects amount in paise (1 INR = 100 paise)
        amount_in_paise = amount * 100

        try:
            order = client.order.create({
                "amount": amount_in_paise,
                "currency": "INR",
                "receipt": f"user_{request.user.id}_{int(request.user.id)}"
            })
        except Exception as e:
            logger.error(f"Razorpay order creation failed: {e}")
            return Response({"message": f"Failed to create payment order: {str(e)}"}, status=500)

        CreditOrders.objects.create(
            user=request.user,
            amount=amount,  # INR amount
            status="pending",
            gateway_order_id=order["id"]
        )

        return Response({
            "order_id": order["id"],
            "amount": amount_in_paise,
            "currency": "INR",
            "key": settings.RAZORPAY_KEY_ID or ""
        })


class VerifyPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not settings.PAYMENT_ENABLED:
            return Response(
                {"message": "Payments are currently disabled by the system configuration."},
                status=403
            )

        razorpay_order_id = request.data.get("razorpay_order_id")
        razorpay_payment_id = request.data.get("razorpay_payment_id")
        razorpay_signature = request.data.get("razorpay_signature")

        if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
            return Response({"message": "Missing payment verification parameters"}, status=400)

        data = {
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": razorpay_payment_id,
            "razorpay_signature": razorpay_signature,
        }

        try:
            client.utility.verify_payment_signature(data)
        except razorpay.errors.SignatureVerificationError:
            logger.warning(f"Invalid payment signature for order {razorpay_order_id}")
            return Response({"message": "Invalid payment signature"}, status=400)
        except Exception as e:
            logger.error(f"Payment verification error: {e}")
            return Response({"message": "Payment verification failed"}, status=400)

        try:
            payment = CreditOrders.objects.get(gateway_order_id=razorpay_order_id)
        except CreditOrders.DoesNotExist:
            return Response({"message": "Payment order not found"}, status=404)

        if payment.status == "success":
            return Response({"message": "Payment already processed", "status": "success"})

        payment.status = "success"
        payment.gateway_payment_id = razorpay_payment_id
        payment.gateway_signature = razorpay_signature
        payment.save()

        add_credits(payment)

        return Response({"message": "Payment verified and credits added successfully"})


class HistoryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallet_balance = 0
        if hasattr(request.user, 'wallet'):
            wallet_balance = request.user.wallet.balance

        orders = CreditOrders.objects.filter(user=request.user).order_by("-created_at")[:20]
        orders_data = [{
            "id": order.id,
            "gateway_order_id": order.gateway_order_id,
            "gateway_payment_id": order.gateway_payment_id,
            "amount": order.amount,
            "credits": order.amount * 10,
            "status": order.status,
            "created_at": order.created_at.isoformat(),
        } for order in orders]

        usages = CreditUsage.objects.filter(wallet__user=request.user).order_by("-created_at")[:20]
        usages_data = [{
            "id": usage.id,
            "amount": usage.amount,
            "transaction_type": usage.transaction_type,
            "description": usage.description,
            "created_at": usage.created_at.isoformat(),
        } for usage in usages]

        return Response({
            "balance": wallet_balance,
            "payment_enabled": settings.PAYMENT_ENABLED,
            "payment_option": settings.PAYMENTOPTION,
            "orders": orders_data,
            "usages": usages_data,
        })


@method_decorator(csrf_exempt, name='dispatch')
class RazorpayWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if not settings.PAYMENT_ENABLED:
            return Response({"message": "Payments are disabled"}, status=403)

        webhook_signature = request.headers.get("X-Razorpay-Signature")
        webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET

        if not webhook_signature:
            return Response({"message": "Missing webhook signature"}, status=400)

        body_bytes = request.body
        body_str = body_bytes.decode('utf-8')

        try:
            client.utility.verify_webhook_signature(body_str, webhook_signature, webhook_secret)
        except razorpay.errors.SignatureVerificationError:
            logger.warning("Invalid Razorpay webhook signature")
            return Response({"message": "Invalid webhook signature"}, status=400)

        try:
            event_data = json.loads(body_str)
            event_name = event_data.get("event")
            payload = event_data.get("payload", {})

            if event_name in ["payment.captured", "order.paid"]:
                payment_entity = payload.get("payment", {}).get("entity", {})
                order_id = payment_entity.get("order_id")
                payment_id = payment_entity.get("id")

                if order_id:
                    try:
                        payment = CreditOrders.objects.get(gateway_order_id=order_id)
                        if payment.status != "success":
                            payment.status = "success"
                            payment.gateway_payment_id = payment_id
                            payment.save()
                            add_credits(payment)
                            logger.info(f"Webhook successfully processed order {order_id}")
                    except CreditOrders.DoesNotExist:
                        logger.warning(f"Order {order_id} not found during webhook processing")

            return Response({"status": "ok"})
        except Exception as e:
            logger.error(f"Error handling webhook: {e}")
            return Response({"message": "Error processing webhook"}, status=500)