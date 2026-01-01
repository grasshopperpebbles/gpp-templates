from __future__ import annotations

from fastapi import FastAPI

from app.api.v1.api import api_router

app = FastAPI(title="GPP FastAPI")
app.include_router(api_router, prefix="/api/v1")

# GraphQL (Optional)
# To enable GraphQL:
# 1. Install: pip install 'strawberry-graphql[fastapi]'
# 2. Uncomment the lines below
# 3. Access GraphQL at: http://localhost:8000/graphql
#
# try:
#     from app.graphql.schema import get_graphql_router
#     graphql_router = get_graphql_router()
#     app.include_router(graphql_router, prefix="/graphql")
# except ImportError:
#     # Strawberry not installed, GraphQL disabled
#     pass
