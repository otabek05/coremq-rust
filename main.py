import os
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    ListFlowable,
    ListItem,
)
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics


def parse_markdown(md_text):
    """
    Very simple Markdown parser for resume-style markdown.
    Supports:
    - #, ##, ### headings
    - bullet lists (- )
    - normal paragraphs
    """

    lines = md_text.split("\n")
    parsed = []

    for line in lines:
        line = line.strip()

        if not line:
            parsed.append(("spacer", None))
            continue

        if line.startswith("### "):
            parsed.append(("h3", line[4:]))
        elif line.startswith("## "):
            parsed.append(("h2", line[3:]))
        elif line.startswith("# "):
            parsed.append(("h1", line[2:]))
        elif line.startswith("- "):
            parsed.append(("bullet", line[2:]))
        else:
            parsed.append(("paragraph", line))

    return parsed


def generate_pdf(md_file, output_pdf):
    doc = SimpleDocTemplate(
        output_pdf,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    elements = []
    styles = getSampleStyleSheet()

    # Custom styles for design
    h1_style = ParagraphStyle(
        "H1",
        parent=styles["Heading1"],
        fontSize=20,
        spaceAfter=10,
        textColor=colors.HexColor("#1F2937"),
    )

    h2_style = ParagraphStyle(
        "H2",
        parent=styles["Heading2"],
        fontSize=14,
        spaceBefore=12,
        spaceAfter=6,
        textColor=colors.HexColor("#111827"),
    )

    h3_style = ParagraphStyle(
        "H3",
        parent=styles["Heading3"],
        fontSize=12,
        spaceBefore=6,
        spaceAfter=4,
        textColor=colors.HexColor("#374151"),
    )

    normal_style = ParagraphStyle(
        "NormalCustom",
        parent=styles["Normal"],
        fontSize=10.5,
        leading=14,
        spaceAfter=4,
    )

    bullet_items = []

    with open(md_file, "r", encoding="utf-8") as f:
        md_text = f.read()

    parsed = parse_markdown(md_text)

    for item_type, content in parsed:
        if item_type == "h1":
            elements.append(Paragraph(content, h1_style))

        elif item_type == "h2":
            # flush bullet list before new section
            if bullet_items:
                elements.append(
                    ListFlowable(
                        bullet_items,
                        bulletType="bullet",
                    )
                )
                bullet_items = []
            elements.append(Paragraph(content, h2_style))

        elif item_type == "h3":
            if bullet_items:
                elements.append(
                    ListFlowable(
                        bullet_items,
                        bulletType="bullet",
                    )
                )
                bullet_items = []
            elements.append(Paragraph(content, h3_style))

        elif item_type == "bullet":
            bullet_items.append(
                ListItem(Paragraph(content, normal_style))
            )

        elif item_type == "paragraph":
            if bullet_items:
                elements.append(
                    ListFlowable(
                        bullet_items,
                        bulletType="bullet",
                    )
                )
                bullet_items = []
            elements.append(Paragraph(content, normal_style))

        elif item_type == "spacer":
            elements.append(Spacer(1, 6))

    # flush remaining bullets
    if bullet_items:
        elements.append(
            ListFlowable(
                bullet_items,
                bulletType="bullet",
            )
        )

    doc.build(elements)


if __name__ == "__main__":
    input_md = "resume.md"  # your markdown file
    output_pdf = "resume.pdf"

    generate_pdf(input_md, output_pdf)
    print("PDF generated successfully!")
