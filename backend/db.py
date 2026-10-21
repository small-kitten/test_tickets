import sqlite3
from datetime import datetime, timezone

DB_PATH = "tickets.db"
class Db:
    def __init__(self):
        self.connection = sqlite3.connect(DB_PATH)
        self.connection.row_factory = sqlite3.Row
        self.connection.execute('''
        CREATE TABLE IF NOT EXISTS tickets (
        id      INTEGER PRIMARY KEY AUTOINCREMENT,
        problem TEXT NOT NULL,
        author  TEXT NOT NULL,
        state   TEXT NOT NULL DEFAULT 'New',
        date    TEXT NOT NULL
        )
        ''')
        self.connection.commit()
        self._closed = False

    def read_db(self):
        db_rows = self.connection.execute("SELECT * FROM tickets").fetchall()
        return [dict(r) for r in db_rows]
    
    def get_by_id(self, ticket_id: int):
        row = self.connection.execute(
            "SELECT * FROM tickets WHERE id = ?",
            (ticket_id,),
        ).fetchone()
        return dict(row) if row else None

    def create_row(self,data: dict):
        now = datetime.now(timezone.utc).isoformat()
        self.connection.execute(
            "INSERT INTO tickets (problem, author, state, date) VALUES (?, ?, ?, ?)",
            (data["problem"], data["author"], "New", now),)
        self.connection.commit()

   def update_state(self, ticket_id: int, state: str):
    existing = self.get_by_id(ticket_id)
    if existing is None:
        return None
    self.connection.execute(
        "UPDATE tickets SET state = ? WHERE id = ?",
        (state, ticket_id),
    )
    self.connection.commit()
    return self.get_by_id(ticket_id)

    def close(self):
        if not self._closed:
            self.connection.close()
            self._closed = True

    def delete_ticket(self, ticket_id: int):
        existing = self.get_by_id(ticket_id)
        if existing is None:
            return False    
        self.connection.execute(
        "DELETE FROM tickets WHERE id = ?",
        (ticket_id,),
        )
        self.connection.commit()
        return True

    def select_where_state(self, state: str):
        rows = self.connection.execute(
            "SELECT * FROM tickets WHERE state = ?",
            (state,),
            ).fetchall()
        return [dict(r) for r in rows]


    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
        return False
