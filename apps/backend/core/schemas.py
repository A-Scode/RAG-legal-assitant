from pydantic import BaseModel
from typing import List , Optional

class PageNodeSchema(BaseModel):
    node_id : str
    title : str
    summary : Optional[str] = None
    prefix_summary : Optional[str] = None
    content : Optional[str] = None
    page_index : Optional[int] = None

    nodes : List['PageNodeSchema'] = []