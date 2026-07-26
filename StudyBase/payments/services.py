import razorpay
from django.conf import settings
from django.db import transaction
from .models import CreditUsage

client = razorpay.Client(
    auth=(
        settings.RAZORPAY_KEY_ID or "",
        settings.RAZORPAY_KEY_SECRET or ""
    )
)

@transaction.atomic
def add_credits(payment):
    """
    Adds credits to the user's wallet based on payment amount.
    1 INR = 10 Credits.
    """
    wallet = payment.user.wallet
    credits_to_add = payment.amount * 10

    wallet.credit(credits_to_add)

    CreditUsage.objects.create(
        wallet=wallet,
        amount=credits_to_add,
        transaction_type="credit",
        description=f"Purchased {credits_to_add} credits (Order #{payment.gateway_order_id})"
    )