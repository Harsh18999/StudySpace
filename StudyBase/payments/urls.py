from django.urls import path
from .views import OrderAPIView, VerifyPaymentView, HistoryAPIView, RazorpayWebhookView

urlpatterns = [
    path('create-order/', OrderAPIView.as_view(), name='create-order'),
    path('verify/', VerifyPaymentView.as_view(), name='verify-payment'),
    path('history/', HistoryAPIView.as_view(), name='payment-history'),
    path('webhook/', RazorpayWebhookView.as_view(), name='razorpay-webhook'),
]
