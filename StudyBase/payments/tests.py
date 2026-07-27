from unittest.mock import patch
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from accounts.models import User, CreditWallet
from payments.models import CreditOrders, CreditUsage
from payments.services import add_credits
from payments.utils import calculate_resource_credit_cost, calculate_module_credit_cost
from spaces.models import Space, Module, Resource
from ai.models import Notes, ResourseQuizes, FlashCards, ModuleQuizes, ModuleFlashcards

class PaymentsTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            name="Test User",
            email="testuser@example.com",
            password="testpassword123"
        )
        self.wallet, _ = CreditWallet.objects.get_or_create(user=self.user)
        self.wallet.balance = 50
        self.wallet.save()
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.space = Space.objects.create(name="Test Space", user=self.user)
        self.module = Module.objects.create(name="Test Module", space=self.space)
        self.resource = Resource.objects.create(module=self.module, type="youtube")

    def test_models_str(self):
        order = CreditOrders.objects.create(
            user=self.user,
            amount=10,
            gateway_order_id="order_test_123"
        )
        usage = CreditUsage.objects.create(
            wallet=self.wallet,
            amount=100,
            transaction_type="credit",
            description="Test Purchase"
        )
        self.assertIn("testuser@example.com", str(order))
        self.assertIn("testuser@example.com", str(usage))

    def test_credit_cost_calculations(self):
        # Resource cost: 10 per instruction
        self.assertEqual(calculate_resource_credit_cost([{"type": "notes"}]), 10)
        self.assertEqual(calculate_resource_credit_cost([{"type": "notes"}, {"type": "quize"}]), 20)

        # Module cost: (resources * 10) + max(0, items - (resources * 10))
        # 1 resource, 10 items -> 10 credits
        self.assertEqual(calculate_module_credit_cost(1, 10), 10)
        # 1 resource, 15 items -> 15 credits
        self.assertEqual(calculate_module_credit_cost(1, 15), 15)
        # 2 resources, 25 items -> 25 credits
        self.assertEqual(calculate_module_credit_cost(2, 25), 25)
        # 2 resources, 10 items -> 20 credits
        self.assertEqual(calculate_module_credit_cost(2, 10), 20)

    def test_add_credits(self):
        order = CreditOrders.objects.create(
            user=self.user,
            amount=20,
            gateway_order_id="order_test_456"
        )
        self.user.refresh_from_db()
        add_credits(order)
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.balance, 250)  # 50 initial + 200

    @override_settings(PAYMENT_ENABLED=True)
    @patch("payments.views.client.order.create")
    def test_create_order_view(self, mock_razorpay_create):
        mock_razorpay_create.return_value = {"id": "order_mock_789"}
        response = self.client.post("/api/payments/create-order/", {"amount": 50})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["order_id"], "order_mock_789")
        self.assertEqual(response.data["amount"], 5000)

    @override_settings(PAYMENT_ENABLED=True)
    @patch("payments.views.client.utility.verify_payment_signature")
    def test_verify_payment_view(self, mock_verify):
        order = CreditOrders.objects.create(
            user=self.user,
            amount=10,
            gateway_order_id="order_to_verify"
        )
        payload = {
            "razorpay_order_id": "order_to_verify",
            "razorpay_payment_id": "pay_mock_123",
            "razorpay_signature": "sig_mock_123"
        }
        response = self.client.post("/api/payments/verify/", payload)
        self.assertEqual(response.status_code, 200)
        order.refresh_from_db()
        self.assertEqual(order.status, "success")
        self.assertEqual(order.gateway_payment_id, "pay_mock_123")

    @override_settings(PAYMENT_ENABLED=False)
    def test_payments_disabled_returns_403(self):
        response = self.client.post("/api/payments/create-order/", {"amount": 50})
        self.assertEqual(response.status_code, 403)
        self.assertIn("disabled", response.data["message"])

    def test_insufficient_credits_pre_check(self):
        # Set balance to 5 credits (not enough for 10 credit requirement)
        self.wallet.balance = 5
        self.wallet.save()

        payload = {
            "resource_id": str(self.resource.pk),
            "job_id": "00000000-0000-0000-0000-000000000001",
            "instructions": [{"type": "notes", "title": "Test Note", "text": "gen"}]
        }
        response = self.client.post("/api/ai/generate/", payload, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["message"], "Insufficient credits")
        self.assertEqual(response.data["required_credits"], 60)
        self.assertEqual(response.data["current_balance"], 5)

    def test_post_save_debit_signals(self):
        self.wallet.balance = 100
        self.wallet.save()

        # Create Resource Note -> should debit 10 credits
        note = Notes.objects.create(
            title="Python Summary",
            resource=self.resource,
            path="notes/test.docx"
        )
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.balance, 90)

        usage = CreditUsage.objects.filter(wallet=self.wallet).last()
        self.assertIsNotNone(usage)
        self.assertEqual(usage.amount, 10)
        self.assertEqual(usage.transaction_type, "debit")
        self.assertIn("Python Summary", usage.description)

    def test_history_view(self):
        response = self.client.get("/api/payments/history/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("balance", response.data)
        self.assertIn("orders", response.data)
        self.assertIn("usages", response.data)
