from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from db import Db
from schemas import Ticket, TicketCreate, TicketStateUpdate

app = FastAPI(title="Заявки")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db=Db()


@app.on_event("shutdown")
def shutdown():
    db.close()


@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/tickets", response_model=list[Ticket])
def list_tickets():
    return db.read_db()


@app.post("/tickets", response_model=Ticket, status_code=201)
def create_ticket(payload: TicketCreate):
    return db.create_row(payload.model_dump())


@app.patch("/tickets/{ticket_id}/state", response_model=Ticket)
def change_state(ticket_id: int, payload: TicketStateUpdate):
    ticket = db.update_state(ticket_id, payload.state)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@app.delete("/tickets/{ticket_id}", status_code=204)
def delete_ticket(ticket_id: int):
    if not db.delete_ticket(ticket_id):
        raise HTTPException(status_code=404, detail="Ticket not found")
    return None
