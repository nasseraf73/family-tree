import pypdf
from pathlib import Path

p = Path(r"C:\Users\ASUS\Documents\Drive D\my apps and programs\FamilyTree Al-Nammari\report\build\FamilyTree-Performance-Report.pdf")
r = pypdf.PdfReader(str(p))

# Count link annotations across all pages
total_links = 0
internal_links = 0
external_links = 0
for i, page in enumerate(r.pages):
    if "/Annots" in page:
        annots = page["/Annots"]
        for annot_ref in annots:
            annot = annot_ref.get_object() if hasattr(annot_ref, 'get_object') else annot_ref
            if annot.get("/Subtype") == "/Link":
                total_links += 1
                if "/A" in annot:
                    a = annot["/A"].get_object() if hasattr(annot["/A"], 'get_object') else annot["/A"]
                    if "/URI" in a:
                        external_links += 1
                    elif "/D" in a:
                        internal_links += 1
                elif "/Dest" in annot:
                    internal_links += 1

print(f"Total link annotations: {total_links}")
print(f"  Internal (TOC) links: {internal_links}")
print(f"  External links: {external_links}")

# Sample text from first 3 pages
print()
print("=== Page 1 sample ===")
print(r.pages[0].extract_text()[:500])
print()
print("=== Page 14 (Scenario 2) sample ===")
print(r.pages[13].extract_text()[:500])
