from docling.document_converter import DocumentConverter
from docling.document_converter import ConversionResult
from typing import List
from django.conf import settings
from openai import OpenAI
from langchain_core.embeddings import Embeddings
import re

docling_converter = DocumentConverter()

class OpenRouterMultimodalEmbeddings(Embeddings):
    def __init__(self, model: str, api_key: str, base_url: str):
        self.model = model
        self.api_key = api_key
        self.base_url = base_url
        self.client = OpenAI(api_key=api_key, base_url=base_url)

    def _embed(self, text: str) -> List[float]:
        # Multimodal models on OpenRouter often expect this complex input structure 
        # even for text-only embeddings.
        response = self.client.embeddings.create(
            model=self.model,
            input=[
                {
                    "content": [
                        {"type": "text", "text": text},
                    ]
                }
            ],
            encoding_format="float"
        )
        if not response.data:
            raise ValueError("No embedding data received from OpenRouter API")
        return response.data[0].embedding

    def embed_query(self, text: str) -> List[float]:
        return self._embed(text)

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        # For efficiency, we would ideally batch these, but many multimodal endpoints 
        # have strict batching or formatting limits. For now, we embed sequentially.
        return [self._embed(t) for t in texts]

embeddings = OpenRouterMultimodalEmbeddings(
        model=settings.OPEN_ROUTER_EMBEDDING_MODEL,
        api_key=settings.OPEN_ROUTER_EMBEDDING_KEY,
        base_url=settings.OPEN_ROUTER_EMBEDDING_URL,
    )

def convert_docx_to_text(file_path: str) -> ConversionResult:
    return docling_converter.convert(file_path)


def embed_text(text: str, is_query: bool = True) -> List[float]:
    return embeddings.embed_query(text)



def clean_group_name(name: str) -> str:
    clean = re.sub(r'[^a-zA-Z0-9._-]', '_', str(name))
    return clean[:99]