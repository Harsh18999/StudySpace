import logging

from django.db.models.signals import post_delete
from django.dispatch import receiver

from django.conf import settings

logger = logging.getLogger(__name__)


@receiver(post_delete, sender='ai.Notes')
def delete_notes_file_from_s3(sender, instance, **kwargs):
    """
    When a Notes record is deleted, remove the corresponding .docx file
    from S3/object storage so we don't accumulate orphaned files.
    """
    from ai.services.s3 import s3

    bucket = settings.BUCKET_NAME  # e.g. "StudyBase"
    s3_key = instance.path          # e.g. "notes/<uuid>.docx"

    if not s3_key:
        return

    try:
        s3.delete_object(Bucket=bucket, Key=s3_key)
        logger.info("Deleted S3 object '%s' for Notes %s", s3_key, instance.note_id)
    except Exception as exc:
        logger.warning(
            "Failed to delete S3 object '%s' for Notes %s: %s",
            s3_key, instance.note_id, exc
        )


@receiver(post_delete, sender='ai.IndexPDFs')
def delete_pdf_vectors_from_store(sender, instance, **kwargs):
    """
    When an IndexPDFs record is deleted, remove all associated vectors
    from the pgvector store so the index stays consistent.
    The vectors were stored with metadata: { "pdf_id": str(file_id) }
    """
    from ai.services.dep import pdf_vector_store

    pdf_id = str(instance.file.file_id)

    try:
        # PGVectorStore.delete() accepts a filter dict for metadata
        pdf_vector_store.delete(filter={"pdf_id": pdf_id})
        logger.info("Deleted pgvector embeddings for pdf_id '%s'", pdf_id)
    except Exception as exc:
        logger.warning(
            "Failed to delete pgvector embeddings for pdf_id '%s': %s",
            pdf_id, exc
        )