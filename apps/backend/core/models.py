from datetime import timedelta
from typing import List, Optional

from django.contrib.auth.models import AbstractUser
from django.core.validators import FileExtensionValidator
from django.db import models
from django.utils import timezone
import docx
import uuid6

        


class User(AbstractUser):
    state = models.CharField(max_length=100 , null=True, blank=True)
    city = models.CharField(max_length=100 , null=True, blank=True)
    occupation = models.CharField(max_length=100 , null=True, blank=True)
    details = models.TextField(null=True, blank=True , max_length=1000)
    
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
    doc_id = models.UUIDField(primary_key=True, default=uuid6.uuid7, editable=False)
    title = models.CharField(max_length=100)
    content = models.TextField(null=True , blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    file = models.FileField(upload_to='documents/',validators=[FileExtensionValidator(['pdf','docx', 'txt'])])
    embedding_status = models.CharField(max_length=100 , choices=[("pending" , "pending") , ("embedding" , "embedding") , ("embedding_done" , "embedding_done") , ("embedding_failed" , "embedding_failed")] , default="pending")
    verified = models.BooleanField(default=False)
    
    def __str__(self):
        return self.title

    def save(self , *args , **kwargs):
        if self.file:
            if self.file.name.endswith('.docx'):
                doc = docx.Document(self.file)
                self.content = "\n".join([para.text for para in doc.paragraphs])
            elif self.file.name.endswith('.pdf'):
                pass
            elif self.file.name.endswith('.txt'):
                with open(self.file.path, 'r') as f:
                    self.content = f.read()
            super().save(*args, **kwargs)


class OTP(models.Model):
    otp = models.CharField(max_length=6)
    email = models.EmailField()
    otp_type = models.CharField(max_length=20 , choices=[("forget-password" , "forget-password") , ("register" , "register")])
    created_at = models.DateTimeField(auto_now_add=True)
    verified = models.BooleanField(default=False)
    def is_valid(self):
        return self.created_at + timedelta(minutes=5) > timezone.now()



class DocumentRefered(models.Model):
    message = models.ForeignKey(ChatMessage, on_delete=models.CASCADE)
    document = models.ForeignKey(Document, on_delete=models.CASCADE)
    pages = models.JSONField(default=list)