from docling.document_converter import DocumentConverter
from docling.document_converter import ConversionResult
from langchain_huggingface import HuggingFaceEmbeddings
from typing import List
from django.conf import settings
from transformers import AutoTokenizer , AutoModel

docling_converter = DocumentConverter()


embeddings = HuggingFaceEmbeddings(
        model_name=settings.EMBEDDING_MODEL_ID,
        model_kwargs={'device': 'cuda'},
        cache_folder="./my_local_models",
    )

def convert_docx_to_text(file_path: str) -> ConversionResult:
    return docling_converter.convert(file_path)


def embed_text(text: str) -> List[float]:
    return embeddings.embed_query(f"Represent this query for retrieving relevant documents: {text}")