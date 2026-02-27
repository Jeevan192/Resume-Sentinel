"""
PDF Resume Parser — Robust text extraction with fallback handling.
Handles multi-page PDFs, corrupted files, and edge cases.
"""
import pdfplumber
import io
import logging

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_bytes: bytes) -> dict:
    """
    Extract text from a PDF file.
    
    Returns:
        dict with keys:
            - text: extracted full text
            - pages: list of per-page text
            - page_count: number of pages
            - success: bool
            - error: error message if any
    """
    result = {
        "text": "",
        "pages": [],
        "page_count": 0,
        "success": False,
        "error": None
    }

    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            result["page_count"] = len(pdf.pages)

            if result["page_count"] == 0:
                result["error"] = "PDF has no pages"
                return result

            # Guard against absurdly large PDFs (likely not a resume)
            if result["page_count"] > 20:
                result["error"] = "PDF exceeds 20 pages — unlikely to be a resume"
                return result

            for i, page in enumerate(pdf.pages):
                try:
                    page_text = page.extract_text() or ""
                    # Also try extracting from tables
                    tables = page.extract_tables()
                    table_text = ""
                    if tables:
                        for table in tables:
                            for row in table:
                                if row:
                                    cleaned = [str(cell).strip() for cell in row if cell]
                                    table_text += " | ".join(cleaned) + "\n"
                    
                    combined = page_text
                    if table_text and table_text.strip() not in page_text:
                        combined += "\n" + table_text

                    result["pages"].append(combined.strip())
                except Exception as e:
                    logger.warning(f"Failed to extract page {i+1}: {e}")
                    result["pages"].append("")

            # Extract hyperlink annotations from PDF (LinkedIn, GitHub URLs etc.)
            hyperlink_urls = []
            try:
                for page in pdf.pages:
                    annots = page.annots or []
                    for annot in annots:
                        uri = annot.get("uri", "")
                        if uri and isinstance(uri, str) and uri.startswith("http"):
                            hyperlink_urls.append(uri)
            except Exception as e:
                logger.warning(f"Could not extract hyperlinks from PDF: {e}")

            result["text"] = "\n\n".join(result["pages"]).strip()
            # Append hyperlink URLs so entity extractor can find them
            if hyperlink_urls:
                result["text"] += "\n" + "\n".join(hyperlink_urls)

            # Edge case: PDF is image-only (no extractable text)
            if len(result["text"].strip()) < 20:
                result["error"] = "Very little text extracted — PDF may be image-based or scanned"
                result["success"] = len(result["text"].strip()) > 0
                return result

            result["success"] = True

    except Exception as e:
        logger.error(f"PDF parsing failed: {e}")
        result["error"] = f"PDF parsing error: {str(e)}"

    return result
