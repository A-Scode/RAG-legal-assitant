import logging

from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Document
from .tasks import chunk_and_store

logger = logging.getLogger('django')


# document chunking and embedding pipeline
@receiver(post_save , sender=Document)
def create_document_vector(sender , instance , **kwargs):
    logger.info("post save signal triggered")
    doc = instance
    logger.info(f"Document Id: {doc.doc_id}")

    transaction.on_commit(lambda: chunk_and_store.enqueue(str(doc.doc_id)))