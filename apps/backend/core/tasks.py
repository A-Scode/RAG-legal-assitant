from django_tasks import task
from .models import Document
from .qdrant import get_qdrant_client ,create_collection
from django.conf import settings
from docling.document_converter import DocumentConverter,PdfFormatOption
from docling_core.transforms.chunker.hybrid_chunker import HybridChunker
from .services import embed_text
from qdrant_client.models import PointStruct
from docling_core.transforms.chunker.tokenizer.huggingface import HuggingFaceTokenizer
from transformers import AutoTokenizer
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.datamodel.base_models import InputFormat
import logging , uuid6
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger('django')


@task
def chunk_and_store(doc_id: str):
    logger.info(f"task started : chunking and storing document {doc_id}")
    doc = Document.objects.get(doc_id=doc_id)
    try:
        if not doc.verified or doc.file:
            doc.embedding_status = "embedding"
            Document.objects.filter(pk=doc.pk).update(embedding_status="embedding")
            client = get_qdrant_client()
            collection_name = settings.QDRANT_COLLECTION_NAME

            create_collection()

            pipeline_options = PdfPipelineOptions()
            pipeline_options.do_ocr = True
            pipeline_options.do_table_structure = True
            pipeline_options.accelerator_options.device = "cpu"

            converter = DocumentConverter(
                format_options={
                    InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
                }
            )
            result = converter.convert(doc.file.path)

            Document.objects.filter(pk=doc.pk).update(content=result.document.export_to_text())

            # Use the hosted model's ID for tokenization counts if possible
            tokenizer_id = settings.OPEN_ROUTER_EMBEDDING_MODEL.split(':')[0]
            try:
                raw_tokenizer = AutoTokenizer.from_pretrained(tokenizer_id)
            except Exception:
                # Fallback to a standard tokenizer if the hosted model ID is not standard for tokenization
                raw_tokenizer = AutoTokenizer.from_pretrained("sentence-transformers/all-MiniLM-L6-v2")

            chunker = HybridChunker(max_tokens=384, tokenizer=HuggingFaceTokenizer(tokenizer=raw_tokenizer, max_tokens=384))
            logger.info("chunking document")
            chunks = chunker.chunk(result.document)
            logger.info("document chunked")
            points = []
            logger.info("embedding document")
            for chunk in chunks : 
                # Skip chunks that are mostly empty or just underscores/lines
                text = chunk.text.strip()
                if not text or not text.replace('_', '').replace('-', '').strip():
                    continue

                vector = embed_text(text, is_query=False)
                points.append(
                    PointStruct(
                        id=str(uuid6.uuid7()),
                        vector=vector,
                        payload={
                            "title" : doc.title,
                            "text": text,
                            "doc_id": str(doc.doc_id),
                            "page_numbers" : list(set(
                                p.page_no for item in chunk.meta.doc_items 
                                for p in item.prov if hasattr(p, 'page_no')
                            ))

                        },
                    )
                )
            if points : 
                client.upsert(
                    collection_name=collection_name,
                    points=points,
                    wait=True
                )
            logger.info("document embedded")
            doc.embedding_status = "embedding_done"
            Document.objects.filter(pk=doc.pk).update(embedding_status="embedding_done")
            logger.info("document saved")

    except Exception as e:
        doc.embedding_status = "embedding_failed"
        Document.objects.filter(pk=doc.pk).update(embedding_status="embedding_failed")
        logger.error(f"Error embedding document: {e}")
        print(e)

@task
def send_otp_email_task(email: str, otp: str, otp_type: str):
    logger.info(f"Task started: Sending {otp_type} OTP to {email}")
    
    otp_type_human = otp_type.replace('-', ' ').title()
    subject = f"Your Legal Assistant Verification Code: {otp}"
    from_email = settings.DEFAULT_FROM_EMAIL
    
    context = {
        'otp': otp,
        'otp_type_human': otp_type_human,
    }
    
    html_content = render_to_string('core/email/otp_email.html', context)
    text_content = strip_tags(html_content)
    
    try:
        msg = EmailMultiAlternatives(subject, text_content, from_email, [email])
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        logger.info(f"Successfully sent {otp_type} OTP to {email}")
    except Exception as e:
        logger.error(f"Error sending OTP email to {email}: {e}")
        raise e