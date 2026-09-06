import pypdf
from pathlib import Path

p = Path(r"C:\Users\ASUS\Documents\Drive D\my apps and programs\FamilyTree Al-Nammari\report\build\FamilyTree-Performance-Report.pdf")
r = pypdf.PdfReader(str(p))
print(f"Pages: {len(r.pages)}")
print(f"Title: {r.metadata.title if r.metadata else 'None'}")
print(f"File size: {p.stat().st_size / 1024:.1f} KB")
print()
# Check outline / TOC bookmarks
try:
    outline = r.outline
    def count_outline(items):
        c = 0
        for item in items:
            if isinstance(item, list):
                c += count_outline(item)
            else:
                c += 1
        return c
    print(f"Outline items: {count_outline(outline) if outline else 0}")
except Exception as e:
    print(f"Outline error: {e}")
