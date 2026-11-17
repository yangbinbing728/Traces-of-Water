from pathlib import Path
import re
import json
from collections import Counter
from docx import Document
from docx.shared import Mm, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.text import WD_ALIGN_PARAGRAPH

ROOT = Path('/Users/yangbinbing/Documents/Traces-of-Water')
SOURCE = ROOT / 'output/writing/traces-of-water-64-page-manuscript.md'
OUT = ROOT / 'output/writing'
s = SOURCE.read_text()
pages = []
for raw in re.split(r'(?m)^## Page ', s)[1:]:
    first, rest = raw.split('\n', 1)
    number, title = first.split(' — ', 1)
    kind = re.search(r'类型：([^\n]+)', rest)[1]
    direction = re.search(r'排版提示：([^\n]+)', rest)[1]
    body = rest.split('### Book text\n', 1)[1].strip()
    if kind == '纯照片页':
        body = ''
    pages.append(dict(number=int(number), title=title, kind=kind, direction=direction, body=body))

assert [p['number'] for p in pages] == list(range(1, 65))
assert all(p['body'] or p['kind'] == '纯照片页' for p in pages)

doc = Document()
sec = doc.sections[0]
sec.page_width, sec.page_height = Mm(154.6), Mm(214.6)
sec.top_margin, sec.bottom_margin = Mm(15), Mm(15)
sec.left_margin, sec.right_margin = Mm(16), Mm(16)
sec.header_distance, sec.footer_distance = Mm(7), Mm(7)

def font(style, name, size, east='Hiragino Sans GB', color='000000'):
    st = doc.styles[style]
    st.font.name = name
    st.font.size = Pt(size)
    st.font.color.rgb = RGBColor.from_string(color)
    rf = st.element.get_or_add_rPr().get_or_add_rFonts()
    for attr in ['ascii', 'hAnsi', 'cs']:
        rf.set(qn('w:'+attr), name)
    rf.set(qn('w:eastAsia'), east)
    for attr in ['asciiTheme', 'hAnsiTheme', 'eastAsiaTheme', 'cstheme']:
        rf.attrib.pop(qn('w:'+attr), None)
    return st

st = font('Normal', 'Georgia', 10.5)
st.paragraph_format.line_spacing = Pt(14.3)
st.paragraph_format.space_after = Pt(9)
st.paragraph_format.widow_control = True
font('Title', 'Arial', 17)
font('Heading 1', 'Arial', 13)
font('Heading 2', 'Arial', 10)
font('Header', 'Arial', 7)
font('Footer', 'Arial', 7)
for name, size, color in [('Editor',8.4,'666666'),('CopyLabel',7.5,'000000'),('Sources',9,'000000')]:
    if name not in doc.styles:
        doc.styles.add_style(name,1)
    es = font(name, 'Arial' if name != 'Sources' else 'Georgia', size, color=color)
    es.paragraph_format.line_spacing = Pt(12 if name != 'Sources' else 12.2)
    es.paragraph_format.space_after = Pt(6)
doc.styles['CopyLabel'].font.bold = True
doc.styles['CopyLabel'].paragraph_format.space_before = Pt(12)
doc.styles['CopyLabel'].paragraph_format.space_after = Pt(10)

header = sec.header.paragraphs[0]
header.text = 'TRACES OF WATER   MANUSCRIPT'
header.paragraph_format.space_after = Pt(0)
footer = sec.footer.paragraphs[0]
footer.alignment = WD_ALIGN_PARAGRAPH.RIGHT
footer.add_run('Book page ')
field = OxmlElement('w:fldSimple')
field.set(qn('w:instr'), 'PAGE')
footer._p.append(field)

def add_link(par, url):
    rel = par.part.relate_to(url, 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink', is_external=True)
    h = OxmlElement('w:hyperlink'); h.set(qn('r:id'),rel)
    r = OxmlElement('w:r'); rp = OxmlElement('w:rPr')
    color = OxmlElement('w:color'); color.set(qn('w:val'),'444444'); rp.append(color)
    size = OxmlElement('w:sz'); size.set(qn('w:val'),'16'); rp.append(size)
    r.append(rp); t = OxmlElement('w:t'); t.text = url; r.append(t); h.append(r); par._p.append(h)

for i, p in enumerate(pages):
    if i:
        doc.add_page_break()
    if i == 0:
        doc.add_paragraph('Traces of Water',style='Title')
        doc.add_paragraph('64 页英文逐页书稿。中文说明不印入书中；ENGLISH BOOK TEXT 以下为可复制的英文正文。封面另计，照片页保留无正文。图片说明是选图建议，并不表示相关素材已制作完成。',style='Editor')
    label = doc.add_paragraph(f"Page {p['number']:02d}  {p['title']}",style='Heading 1')
    label.paragraph_format.space_after = Pt(7)
    doc.add_paragraph(p['kind'],style='Editor')
    doc.add_paragraph(p['direction'],style='Editor')
    if not p['body']:
        doc.add_paragraph('IMAGE ONLY',style='CopyLabel')
        doc.add_paragraph('本页有意不设英文正文。最终书页只放选定的照片或材料图像。',style='Editor')
        continue
    doc.add_paragraph('ENGLISH BOOK TEXT',style='CopyLabel')
    for block in p['body'].split('\n\n'):
        para = doc.add_paragraph(style='Sources' if p['number'] in [59,60,61,63] else 'Normal')
        for j,line in enumerate(block.splitlines()):
            if j:
                para.add_run().add_break()
            if line.startswith('https://'):
                add_link(para,line)
            else:
                # Note markers are editable superscript text.
                segments = re.split(r'(\[\d\])',line)
                for seg in segments:
                    r = para.add_run(seg)
                    if re.fullmatch(r'\[\d\]',seg) and not line.startswith(seg):
                        r.font.superscript = True
                        r.font.size = Pt(8)

for element in list(doc.styles.element.iter(qn('w:pBdr'))):
    element.getparent().remove(element)
for element in list(doc.element.iter(qn('w:pBdr'))):
    element.getparent().remove(element)

doc.core_properties.title = 'Traces of Water 64 page manuscript'
doc.core_properties.subject = 'English book copy and Chinese page directions for an artist book'
doc.core_properties.author = ''
doc.core_properties.keywords = 'artist book, water, manuscript'
doc.save(OUT / 'Traces-of-Water-64-page-manuscript.docx')

# A separate plain-text version contains only copy and page delimiters.
copy = ['TRACES OF WATER\n64 PAGE BOOK COPY\n\nPage headings are manuscript navigation. IMAGE ONLY denotes a page without printed copy.\n']
for p in pages:
    copy.append(f"\nPAGE {p['number']:02d}\n\n{p['body'] or '[IMAGE ONLY — no printed text]'}\n")
(OUT / 'Traces-of-Water-English-copy.txt').write_text('\n'.join(copy))

counts = Counter(p['kind'] for p in pages)
words = sum(len(re.findall(r"\b[A-Za-z]+(?:['-][A-Za-z]+)*\b",p['body'])) for p in pages)
(ROOT/'tmp/manuscript/pages.json').write_text(json.dumps(pages,ensure_ascii=False,indent=2))
print(json.dumps({'pages':len(pages),'types':dict(counts),'English_words':words,'output':str(OUT/'Traces-of-Water-64-page-manuscript.docx')},ensure_ascii=False))
