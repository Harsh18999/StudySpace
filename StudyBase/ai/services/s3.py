import boto3
from django.conf import settings
from botocore.config import Config


s3 = boto3.client(
    "s3",
    endpoint_url=settings.BUCKET_ENDPOINT_URL,
    aws_access_key_id=settings.BUCKET_KEY_ID,
    aws_secret_access_key=settings.BUCKET_APPLICATION_KEY,
    config=Config(signature_version="s3v4"),
)