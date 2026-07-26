from django.conf import settings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_postgres import PGEngine, PGVectorStore
from langchain.embeddings import init_embeddings
from langchain_postgres.v2.hybrid_search_config import (
    HybridSearchConfig,
    reciprocal_rank_fusion,
)

config = HybridSearchConfig(
    fusion_function=reciprocal_rank_fusion,
)

embedding = init_embeddings(model='text-embedding-3-small', provider='openai')

splitter = RecursiveCharacterTextSplitter(
    separators=["\n\n", "\n", ".", " "],
    chunk_size=1000,
    chunk_overlap=200
)

import os

class LazyVectorStoreProxy:
    def __init__(self, table_name):
        self._table_name = table_name
        self._pid = None
        self._store = None

    def _get_store(self):
        current_pid = os.getpid()
        if self._pid != current_pid or self._store is None:
            self._pid = current_pid
            conn = settings.VECTOR_DB_CONN_STRING or ""
            if conn and not conn.startswith("postgresql+asyncpg://"):
                async_conn = conn.replace("postgresql://", "postgresql+asyncpg://").replace("?sslmode=require", "?ssl=require")
            else:
                async_conn = conn
            async_conn = async_conn.replace("&channel_binding=require", "").replace("?channel_binding=require", "")
            engine = PGEngine.from_connection_string(async_conn)
            self._store = PGVectorStore.create_sync(
                engine=engine,
                table_name=self._table_name,
                embedding_service=embedding,
                hybrid_search_config=config
            )
        return self._store

    def __getattr__(self, name):
        return getattr(self._get_store(), name)

_VECTOR_SIZE = 1536

video_vector_store = LazyVectorStoreProxy('video_embeddings')
pdf_vector_store = LazyVectorStoreProxy('pdf_embeddings')