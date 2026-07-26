"""
docx.py — Markdown → DOCX conversion using pypandoc.

Usage:
    from .docx import markdown_to_docx

    docx_path = markdown_to_docx(markdown_text, output_path)

Pandoc availability:
    • Local / CI:  install via `brew install pandoc` or `apt-get install pandoc`
    • Server:      add `pandoc` to your Dockerfile / apt dependencies, OR call
                   `pypandoc.download_pandoc()` once at startup to auto-download
                   a binary into the venv.
    • reference.docx (optional):  place a styled reference.docx next to this
                   file to control fonts, styles, and margins in the output.
"""

from pathlib import Path
import pypandoc


def markdown_to_docx(markdown: str, output_path: str) -> str:
    """
    Convert a GitHub-flavored Markdown string to a .docx file.

    Args:
        markdown:    The raw Markdown text (produced by the LLM).
        output_path: Absolute path where the .docx should be saved.

    Returns:
        The output_path string.
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Write markdown to a sibling .md temp file so pandoc can read it
    md_path = output_path.with_suffix(".md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(markdown)

    try:
        extra_args = ["--toc", "--number-sections"]

        # Optionally apply a branded reference.docx for styling
        reference_doc = Path(__file__).parent / "reference.docx"
        if reference_doc.exists():
            extra_args.append(f"--reference-doc={reference_doc}")

        pypandoc.convert_file(
            str(md_path),
            "docx",
            outputfile=str(output_path),
            extra_args=extra_args,
        )
    finally:
        # Clean up the intermediate markdown file
        if md_path.exists():
            md_path.unlink()

    return str(output_path)