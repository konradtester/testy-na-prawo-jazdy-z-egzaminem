#!/usr/bin/env python3
import json
import os
import zipfile
import xml.etree.ElementTree as ET

EXCEL_FILE = "/Users/konradstasiak/gth/testy/KATALOG_dla_kandydatów_na_kierowców_072026.xlsx"
OUTPUT_JS = "/Users/konradstasiak/gth/testy/questions_kat_a.js"
OUTPUT_JSON = "/Users/konradstasiak/gth/testy/questions_kat_a.json"

def parse_excel():
    print(f"Reading {EXCEL_FILE}...")
    with zipfile.ZipFile(EXCEL_FILE) as z:
        # 1. Parse shared strings
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
            for si in tree.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                t = si.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
                if t is not None:
                    shared_strings.append(t.text or '')
                else:
                    texts = [elem.text for elem in si.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t') if elem.text]
                    shared_strings.append(''.join(texts))

        # 2. Parse sheet1
        sheet_tree = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
        rows = sheet_tree.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheetData/{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row')

        questions = []
        
        for r_idx, row in enumerate(rows[1:], start=2):
            row_vals = {}
            for c in row.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                r = c.get('r')
                col_letter = ''.join([ch for ch in r if ch.isalpha()])
                t = c.get('t')
                v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                val = ''
                if v is not None and v.text is not None:
                    if t == 's':
                        val = shared_strings[int(v.text)]
                    else:
                        val = v.text
                row_vals[col_letter] = val
                
            kategorie = [k.strip() for k in row_vals.get('K', '').split(',') if k.strip()]
            if 'A' not in kategorie:
                continue

            num_pytania = row_vals.get('B', '').strip()
            pytanie_text = row_vals.get('C', '').strip()
            odp_a = row_vals.get('D', '').strip()
            odp_b = row_vals.get('E', '').strip()
            odp_c = row_vals.get('F', '').strip()
            poprawna = row_vals.get('G', '').strip().upper()
            media = row_vals.get('H', '').strip()
            zakres = row_vals.get('I', '').strip().upper()
            punkty = row_vals.get('J', '').strip()

            try:
                punkty_val = int(punkty)
            except ValueError:
                punkty_val = 1

            is_specialist = 'SPECJAL' in zakres
            scope_key = 'specjalistyczny' if is_specialist else 'podstawowy'
            q_type = 'yes_no' if poprawna in ['T', 'N'] or not odp_a else 'abc'

            # Media parsing
            media_type = None
            media_stem = None
            media_ext = None
            if media:
                stem, ext = os.path.splitext(media)
                media_stem = stem
                media_ext = ext.lower()
                if media_ext in ['.wmv', '.mp4']:
                    media_type = 'video'
                elif media_ext in ['.jpg', '.jpeg', '.png', '.webp']:
                    media_type = 'image'

            # Build question record
            q_obj = {
                "id": num_pytania,
                "lp": row_vals.get('A', str(len(questions) + 1)),
                "question": pytanie_text,
                "scope": scope_key,
                "points": punkty_val,
                "type": q_type,
                "correct": poprawna,
                "media": media,
                "mediaType": media_type,
                "mediaStem": media_stem,
                "mediaExt": media_ext
            }

            if q_type == 'abc':
                q_obj["options"] = [
                    {"key": "A", "text": odp_a},
                    {"key": "B", "text": odp_b},
                    {"key": "C", "text": odp_c}
                ]
            else:
                q_obj["options"] = [
                    {"key": "T", "text": "TAK"},
                    {"key": "N", "text": "NIE"}
                ]

            questions.append(q_obj)

    print(f"Extracted {len(questions)} questions for Category A.")
    basic_count = sum(1 for q in questions if q['scope'] == 'podstawowy')
    spec_count = sum(1 for q in questions if q['scope'] == 'specjalistyczny')
    media_count = sum(1 for q in questions if q['media'])
    print(f" - Podstawowe: {basic_count}")
    print(f" - Specjalistyczne: {spec_count}")
    print(f" - With media: {media_count}")

    # Write JSON
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)
    print(f"Wrote JSON to {OUTPUT_JSON}")

    # Write JS file so it can be loaded locally via <script src="..."> without CORS issues
    with open(OUTPUT_JS, 'w', encoding='utf-8') as f:
        f.write("// Baza pytań dla kategorii A wygenerowana z KATALOG_dla_kandydatów_na_kierowców_072026.xlsx\n")
        f.write("window.QUESTIONS_KAT_A = ")
        json.dump(questions, f, ensure_ascii=False)
        f.write(";\n")
    print(f"Wrote JS to {OUTPUT_JS}")

if __name__ == '__main__':
    parse_excel()
