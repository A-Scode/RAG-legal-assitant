from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid6
from .schemas import PageNodeSchema

from django_mongodb_backend.fields import ArrayField,ObjectIdAutoField , EmbeddedModelArrayField ,EmbeddedModelField
from django_mongodb_backend.models import EmbeddedModel
from django_pydantic_field import SchemaField
from typing import List , Optional


class User(AbstractUser):
    state = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    occupation = models.CharField(max_length=100)
    
class ChatSession(models.Model):
    session_id = models.UUIDField(primary_key=True, default=uuid6.uuid7, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title
    
class ChatMessage(models.Model):
    msg_id = models.UUIDField(primary_key=True, default=uuid6.uuid7, editable=False)
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE)
    role = models.CharField(max_length=100)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.content
    
class Document(models.Model):

    class DocumentStatus(models.TextChoices):
        NOT_INDEXED = 'Not Indexed'
        IN_PROGRESS = 'in-progress'
        INDEXED = 'Indexed'
    
    doc_id = models.UUIDField(primary_key=True, default=uuid6.uuid7, editable=False)
    title = models.CharField(max_length=100)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    file_path = models.CharField(max_length=100)
    page_index_id = models.CharField(max_length=100)
    page_index_status = models.CharField(max_length=100, choices=DocumentStatus.choices,
                            default=DocumentStatus.NOT_INDEXED)
    
    
    def __str__(self):
        return self.title

    def start_indexing(self):
        self.page_index_status = Document.DocumentStatus.IN_PROGRESS
        self.save()
    
    def complete_indexing(self,tree):
        self.page_index_status = Document.DocumentStatus.INDEXED
        self.save()

    @property
    def doc_tree(self):
        return DocTree.objects.get(tree_id=self.page_index_id).doc_tree




class DocTree(models.Model):
    tree_id = ObjectIdAutoField(primary_key=True)
    doc_tree = SchemaField(List[PageNodeSchema], null=False)
    
    
    
