from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os

from app.core.dependencies import get_db, get_admin_user
from app.schemas.invoice import InvoiceResponse, InvoiceGenerateResponse
from pydantic import BaseModel
from app.services import invoice_service
from app.models.user import User

router = APIRouter()

class InvoiceUpdate(BaseModel):
    is_paid: bool

@router.put("/{invoice_id}/pay", response_model=InvoiceResponse)
def update_invoice_payment_status(
    invoice_id: int,
    status_update: InvoiceUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Mark an invoice as paid/unpaid (Admin only)."""
    invoice = invoice_service.mark_invoice_as_paid(db, invoice_id, status_update.is_paid)
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    return invoice

@router.post("/generate/{user_id}", response_model=InvoiceGenerateResponse)
def generate_user_invoice(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Generate invoice for a user based on unbilled searches (Admin only)."""
    invoice = invoice_service.generate_invoice(db, user_id)
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No unbilled searches found for this user, or user not found."
        )
    return InvoiceGenerateResponse(invoice=invoice, message="Invoice generated successfully")

@router.get("", response_model=list[InvoiceResponse])
def get_all_invoices(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """List all generated invoices (Admin only)."""
    return invoice_service.get_invoices(db)

@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Get details of a specific invoice (Admin only)."""
    invoice = invoice_service.get_invoice_by_id(db, invoice_id)
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    return invoice

@router.get("/download/{invoice_id}")
def download_invoice_pdf(
    invoice_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Download the PDF document of a generated invoice (Admin only)."""
    invoice = invoice_service.get_invoice_by_id(db, invoice_id)
    if not invoice or not invoice.pdf_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice or invoice PDF not found"
        )
        
    if not os.path.exists(invoice.pdf_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice PDF file does not exist on disk"
        )

    filename = os.path.basename(invoice.pdf_path)
    return FileResponse(
        path=invoice.pdf_path,
        media_type="application/pdf",
        filename=filename
    )
