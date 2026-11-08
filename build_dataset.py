#!/usr/bin/env python3
import json
import os
import zipfile
import xml.etree.ElementTree as ET

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
EXCEL_FILE = os.path.join(BASE_DIR, "KATALOG_dla_kandydatów_na_kierowców_072026.xlsx")
OUTPUT_DIR = BASE_DIR

# Categories to generate datasets for. Add more codes here (as they appear in
# column K of the catalog, e.g. "C", "D", "T", "PT") to support them too.
CATEGORIES = ["A", "A1", "A2", "B", "B1"]

NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'


def load_rows():
    with zipfile.ZipFile(EXCEL_FILE) as z:
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
            for si in tree.findall(NS + 'si'):
                t = si.find(NS + 't')
                if t is not None:
                    shared_strings.append(t.text or '')
                else:
                    texts = [elem.text for elem in si.iter(NS + 't') if elem.text]
                    shared_strings.append(''.join(texts))

        sheet_tree = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
        rows = sheet_tree.findall(NS + 'sheetData/' + NS + 'row')

        parsed_rows = []
        for row in rows[1:]:
            row_vals = {}
            for c in row.findall(NS + 'c'):
                r = c.get('r')
                col_letter = ''.join([ch for ch in r if ch.isalpha()])
                t = c.get('t')
                v = c.find(NS + 'v')
                val = ''
                if v is not None and v.text is not None:
                    if t == 's':
                        val = shared_strings[int(v.text)]
                    else:
                        val = v.text
                row_vals[col_letter] = val
            parsed_rows.append(row_vals)
        return parsed_rows


def build_question(row_vals, category):
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

    q_obj = {
        "id": num_pytania,
        "lp": row_vals.get('A', ''),
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

    return q_obj


def build_category(rows, category):
    questions = []
    for row_vals in rows:
        kategorie = [k.strip() for k in row_vals.get('K', '').split(',') if k.strip()]
        if category not in kategorie:
            continue
        questions.append(build_question(row_vals, category))

    print(f"Extracted {len(questions)} questions for Category {category}.")
    basic_count = sum(1 for q in questions if q['scope'] == 'podstawowy')
    spec_count = sum(1 for q in questions if q['scope'] == 'specjalistyczny')
    media_count = sum(1 for q in questions if q['media'])
    print(f" - Podstawowe: {basic_count}")
    print(f" - Specjalistyczne: {spec_count}")
    print(f" - With media: {media_count}")

    cat_lower = category.lower()
    output_json = os.path.join(OUTPUT_DIR, f"questions_kat_{cat_lower}.json")
    output_js = os.path.join(OUTPUT_DIR, f"questions_kat_{cat_lower}.js")

    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)
    print(f"Wrote JSON to {output_json}")

    with open(output_js, 'w', encoding='utf-8') as f:
        f.write(f"// Baza pytań dla kategorii {category} wygenerowana z KATALOG_dla_kandydatów_na_kierowców_072026.xlsx\n")
        f.write(f"window.QUESTIONS_KAT_{category} = ")
        json.dump(questions, f, ensure_ascii=False)
        f.write(";\n")
    print(f"Wrote JS to {output_js}")


def main():
    print(f"Reading {EXCEL_FILE}...")
    rows = load_rows()
    for category in CATEGORIES:
        build_category(rows, category)


if __name__ == '__main__':
    main()
