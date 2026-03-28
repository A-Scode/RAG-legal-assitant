import logging

from django.conf import settings
from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling_core.transforms.chunker.hybrid_chunker import HybridChunker
from docling_core.transforms.chunker.tokenizer.huggingface import HuggingFaceTokenizer
from qdrant_client.models import PointStruct
from transformers import AutoTokenizer
import uuid6

from .models import Document
from .qdrant import create_collection, get_qdrant_client
from .services import embed_text
from .tasks import chunk_and_store

logger = logging.getLogger('django')


# document chunking and embedding pipeline
@receiver(post_save , sender=Document)
def create_document_vector(sender , instance , **kwargs):
    logger.info("post save signal triggered")
    doc = instance
    logger.info(f"Document Id: {doc.doc_id}")

    transaction.on_commit(lambda: chunk_and_store.enqueue(str(doc.doc_id)))