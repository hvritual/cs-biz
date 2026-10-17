"""Canonical generator for the review-only, text-column Excel templates."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED, ZipInfo
from xml.sax.saxutils import escape

DESTINATION = Path(__file__).resolve().parent

def create(filename, column, values):
    ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
    rel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
    package_rel = 'http://schemas.openxmlformats.org/package/2006/relationships'
    parts = {
        '[Content_Types].xml': '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
        '_rels/.rels': f'<Relationships xmlns="{package_rel}"><Relationship Id="rId1" Type="{rel}/officeDocument" Target="xl/workbook.xml"/></Relationships>',
        'xl/workbook.xml': f'<workbook xmlns="{ns}" xmlns:r="{rel}"><sheets><sheet name="选取模板" sheetId="1" r:id="rId1"/></sheets></workbook>',
        'xl/_rels/workbook.xml.rels': f'<Relationships xmlns="{package_rel}"><Relationship Id="rId1" Type="{rel}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="{rel}/styles" Target="styles.xml"/></Relationships>',
        'xl/styles.xml': f'<styleSheet xmlns="{ns}"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf/><xf numFmtId="49" applyNumberFormat="1"/></cellXfs></styleSheet>',
        'xl/worksheets/sheet1.xml': f'<worksheet xmlns="{ns}"><cols><col min="1" max="1" width="32" style="1" customWidth="1"/></cols><sheetData>' + ''.join(f'<row r="{i}"><c r="A{i}" t="inlineStr" s="1"><is><t>{escape(value)}</t></is></c></row>' for i, value in enumerate([column, *values], 1)) + '</sheetData></worksheet>',
    }
    with ZipFile(DESTINATION / filename, 'w') as archive:
        for name, content in parts.items():
            info = ZipInfo(name, date_time=(2026, 10, 17, 0, 0, 0))
            info.compress_type = ZIP_DEFLATED
            archive.writestr(info, '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + content)

if __name__ == '__main__':
    create('targets.xlsx', '编号', ['C-1001', 'C-1006'])
    create('invitations.xlsx', '邮箱', ['new-a@example.test', 'new-b@example.test'])
