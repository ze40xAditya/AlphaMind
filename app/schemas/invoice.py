from datetime import datetime
from pydantic import BaseModel


class InvoiceResponse(BaseModel):
    id: int
    user_id: int
    invoice_number: str
    total_searches: int
    amount: float
    invoice_date: datetime | None = None
    pdf_path: str | None = None

    class Config:
        from_attributes = True


class InvoiceGenerateResponse(BaseModel):
    invoice: InvoiceResponse
    message: str = "Invoice generated successfully"
