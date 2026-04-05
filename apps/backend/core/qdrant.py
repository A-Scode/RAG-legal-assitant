from qdrant_client import QdrantClient
from django.conf import settings
from qdrant_client.models import VectorParams, Distance

# Singleton Client
qdrant_client = None

def get_qdrant_client():
    global qdrant_client
    if qdrant_client is None:
        qdrant_client = QdrantClient(
            url=f"http://{settings.QDRANT_HOST}:{settings.QDRANT_PORT}",
            api_key=settings.QDRANT_API_KEY,
        )
    return qdrant_client

def create_collection():
    client = get_qdrant_client()
    if not client.collection_exists(collection_name=settings.QDRANT_COLLECTION_NAME):
        client.create_collection(
            collection_name=settings.QDRANT_COLLECTION_NAME,
            vectors_config=VectorParams(
                size=2048,
                distance=Distance.COSINE
            ),
        )