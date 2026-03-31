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

            converter = DocumentConverter(
                format_options={
                    InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
                }
            )
            result = converter.convert(doc.file.path)

            Document.objects.filter(pk=doc.pk).update(content=result.document.export_to_text())

            raw_tokenizer = AutoTokenizer.from_pretrained(settings.EMBEDDING_MODEL_ID)

            chunker = HybridChunker(max_tokens=384 ,tokenizer=HuggingFaceTokenizer(tokenizer=raw_tokenizer, max_tokens=384))
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