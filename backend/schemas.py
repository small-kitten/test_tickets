from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field

State = Literal["New", "In Progress", "Done"]


class Ticket(BaseModel):
    id: int
    problem: str
    author: str
    state: State
    date: datetime


class TicketCreate(BaseModel):
    problem: str = Field(..., min_length=1, max_length=200)
    author: str = Field(..., min_length=1, max_length=100)


class TicketStateUpdate(BaseModel):
    state: State