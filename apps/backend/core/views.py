from rest_framework import generics , viewsets , status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated , AllowAny
from .models import User , ChatSession , ChatMessage , Document , DocumentRefered , OTP
from .serializers import UserSerializer , RegisterSerializer , LoginSerializer , ProfileUpdateSerializer , GetOTPSerializer, ChatSessionSerializer, DocumentSerializer
from .qdrant import get_qdrant_client
from .services import embed_text
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema


class UserProfileView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @extend_schema(request=ProfileUpdateSerializer, responses=UserSerializer)
    def patch(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(self.get_serializer(request.user).data)
        


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class GetOTPView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = GetOTPSerializer
    queryset = OTP.objects.all()

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        otp_data = serializer.save()
        return Response(otp_data)


class LoginView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token = serializer.validated_data['token']
        refresh = serializer.validated_data['refresh']
        return Response({
            'user': UserSerializer(user).data,
            'token': token,
            'refresh': refresh,
        })




class ChatSessionViewSet(viewsets.ModelViewSet):
    queryset = ChatSession.objects.all().order_by("-created_at")
    permission_classes = [IsAuthenticated]
    serializer_class = ChatSessionSerializer
    
    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    @action(detail=False, methods=['delete'], url_path='clear-all')
    def clear_all(self, request):
        ChatSession.objects.filter(user=request.user).delete()
        return Response(status=204)

class DocumentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Document.objects.all().order_by("-created_at")
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q')
        if not query:
            return Response({"error": "Query parameter 'q' is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        client = get_qdrant_client()
        embeddings = embed_text(query, is_query=True)
        
        # 1. Semantic Search
        qdrant_results = client.query_points(
            collection_name="legal_documents",
            query=embeddings,
            limit=10,
            with_payload=True
        ).points
        
        # 2. Title Search (Keyword)
        title_matches = Document.objects.filter(title__icontains=query)
        
        search_results = []
        seen_doc_ids = set()

        # Add Title matches first (high priority)
        for doc in title_matches:
            seen_doc_ids.add(str(doc.doc_id))
            search_results.append({
                "doc_id": str(doc.doc_id),
                "title": doc.title,
                "content": doc.content[:300] + "..." if doc.content else "Title match found.",
                "pages": 1,
                "doc_url": doc.file.url,
                "score": 1.0,
                "search_type": "title"
            })

        # Process Semantic results
        doc_ids = []
        for res in qdrant_results:
            if res.payload and res.payload.get("doc_id"):
                doc_ids.append(res.payload.get("doc_id"))
        
        documents = {str(d.doc_id): d.file.url for d in Document.objects.filter(doc_id__in=doc_ids)}

        for res in qdrant_results:
            payload = res.payload or {}
            d_id = str(payload.get("doc_id"))
            
            # If already added via title search, maybe update its score but don't duplicate
            if d_id in seen_doc_ids:
                # Optionally update existing result or skip
                continue
                
            doc_url = documents.get(d_id)
            if not doc_url:
                continue
                
            seen_doc_ids.add(d_id)
            search_results.append({
                "doc_id": d_id,
                "title": payload.get("title"),
                "content": payload.get("content"),
                "pages": payload.get("pages"),
                "doc_url": doc_url,
                "score": res.score,
                "search_type": "semantic"
            })
        
        # Sort by score finally
        search_results.sort(key=lambda x: x['score'], reverse=True)
        
        return Response(search_results)

    
    
    
    
        