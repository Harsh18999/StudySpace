from django.db import models
from accounts.models import User, CreditWallet

# Create your models here.
class CreditUsage(models.Model):
    wallet = models.ForeignKey(CreditWallet, on_delete=models.CASCADE)
    amount = models.PositiveIntegerField()
    transaction_type = models.CharField(max_length=20, choices=[
        ('credit', 'Credit'),
        ('debit', 'Debit'),
        ], default='debit')
    created_at = models.DateTimeField(auto_now_add=True)
    description = models.TextField()

    def __str__(self):
        return f"{self.wallet.user.email} used {self.amount} credits at {self.created_at}"

class CreditOrders(models.Model):
    STATUS_CHOICES= [
            ('pending', 'Pending'),
            ('success', 'Success'),
            ('failed', 'Failed'),
        ]
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    amount = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    gateway_order_id = models.CharField(max_length=100, unique=True)
    gateway_payment_id = models.CharField(max_length=100, blank=True, null=True)
    gateway_signature = models.CharField(max_length=100, blank=True, null=True)
    
    def __str__(self):
        return f"{self.user.email} {self.amount} credits at {self.created_at}"
