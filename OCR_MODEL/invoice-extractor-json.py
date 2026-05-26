import easyocr
import cv2
import re
import json
import pandas as pd
import streamlit as st
from PIL import Image
import numpy as np

# ============================================================
# OCR ENGINE
# ============================================================

class LedgerOCR:

    def __init__(self):

        self.reader = easyocr.Reader(
            ['en'],
            gpu=False
        )

    def extract_text(self, image):

        result = self.reader.readtext(
            image,
            detail=0,
            paragraph=False
        )

        text = "\n".join(result)

        return text


# ============================================================
# PARSER
# ============================================================

class LedgerParser:

    def __init__(self):
        pass

    # ========================================================
    # CLEAN NUMBER
    # ========================================================

    def clean_number(self, text):

        if text is None:
            return None

        text = text.replace("O", "0")
        text = text.replace("o", "0")
        text = text.replace("Q", "0")

        text = re.sub(r"[^0-9.,-]", "", text)

        text = text.replace(",", "")

        try:
            return float(text)
        except:
            return None

    # ========================================================
    # PARSER
    # ========================================================

    def parse(self, text):

        data = {
            "company": None,
            "report_name": None,
            "accounts": []
        }

        # ----------------------------------------------------
        # CLEAN LINES
        # ----------------------------------------------------

        lines = [
            l.strip()
            for l in text.split("\n")
            if l.strip()
        ]

        # ----------------------------------------------------
        # COMPANY
        # ----------------------------------------------------

        for line in lines:

            if "Dagang Distribusi" in line:
                data["company"] = line

            if "Buku Besar" in line:
                data["report_name"] = (
                    "Buku Besar - Mutasi"
                )

        # ----------------------------------------------------
        # ACCOUNT DETECTION
        # ----------------------------------------------------

        account_indexes = []

        for i, line in enumerate(lines):

            if re.match(r"\d{4}-\d{2}-\d{3}", line):

                account_indexes.append(i)

        # ----------------------------------------------------
        # SPLIT SECTIONS
        # ----------------------------------------------------

        for idx in range(len(account_indexes)):

            start = account_indexes[idx]

            if idx < len(account_indexes) - 1:
                end = account_indexes[idx + 1]
            else:
                end = len(lines)

            section = lines[start:end]

            # ------------------------------------------------
            # ACCOUNT CODE
            # ------------------------------------------------

            account_code = section[0]

            # ------------------------------------------------
            # ACCOUNT NAME
            # ------------------------------------------------

            account_name = ""

            if len(section) > 1:
                account_name = section[1]

            account = {
                "account_code": account_code,
                "account_name": account_name,
                "saldo_awal": None,
                "saldo_akhir": None,
                "mutasi": None,
                "transactions": []
            }

            # ------------------------------------------------
            # PARSE SECTION
            # ------------------------------------------------

            i = 0

            while i < len(section):

                line = section[i]

                # --------------------------------------------
                # SALDO AWAL
                # --------------------------------------------

                if "Saldo Awal" in line:

                    value = None

                    match = re.search(
                        r"Saldo Awal[:\s]*([\d.,OQo]+)",
                        line
                    )

                    if match:
                        value = match.group(1)

                    elif i + 1 < len(section):
                        value = section[i + 1]

                    account["saldo_awal"] = (
                        self.clean_number(value)
                    )

                # --------------------------------------------
                # SALDO AKHIR
                # --------------------------------------------

                if "Saldo Akhir" in line:

                    value = None

                    match = re.search(
                        r"Saldo Akhir[:\s]*([\d.,OQo]+)",
                        line
                    )

                    if match:
                        value = match.group(1)

                    elif i + 1 < len(section):
                        value = section[i + 1]

                    account["saldo_akhir"] = (
                        self.clean_number(value)
                    )

                # --------------------------------------------
                # MUTASI
                # --------------------------------------------

                if "Mutasi" in line:

                    value = None

                    match = re.search(
                        r"Mutasi[:\s-]*([\d.,OQo]+)",
                        line
                    )

                    if match:
                        value = match.group(1)

                    elif i + 1 < len(section):
                        value = section[i + 1]

                    account["mutasi"] = (
                        self.clean_number(value)
                    )

                # --------------------------------------------
                # TRANSACTION DETECTION
                # --------------------------------------------

                if re.match(
                    r"\d{1,2}/\d{1,2}/\d{4}",
                    line
                ):

                    tx = {
                        "date": line,
                        "reference": None,
                        "description": None,
                        "amounts": []
                    }

                    # reference
                    if i + 1 < len(section):
                        tx["reference"] = (
                            section[i + 1]
                        )

                    # description
                    if i + 2 < len(section):
                        tx["description"] = (
                            section[i + 2]
                        )

                    # collect nearby numbers
                    nearby = section[i:i+8]

                    amounts = []

                    for n in nearby:

                        nums = re.findall(
                            r"[\d.,OQo]+",
                            n
                        )

                        for num in nums:

                            cleaned = (
                                self.clean_number(num)
                            )

                            if cleaned:
                                amounts.append(cleaned)

                    tx["amounts"] = amounts

                    account["transactions"].append(tx)

                i += 1

            data["accounts"].append(account)

        return data


# ============================================================
# STREAMLIT APP
# ============================================================

st.set_page_config(
    page_title="Ledger OCR Parser",
    layout="wide"
)

st.title("📄 Ledger OCR Parser")
st.write(
    "Upload buku besar / mutasi image and extract JSON automatically."
)

uploaded_file = st.file_uploader(
    "Upload Image",
    type=["jpg", "jpeg", "png"]
)

if uploaded_file is not None:

    # --------------------------------------------------------
    # LOAD IMAGE
    # --------------------------------------------------------

    image = Image.open(uploaded_file)

    st.image(
        image,
        caption="Uploaded Image",
        use_container_width=True
    )

    image_np = np.array(image)

    # --------------------------------------------------------
    # OCR
    # --------------------------------------------------------

    with st.spinner("Running OCR..."):

        ocr = LedgerOCR()

        text = ocr.extract_text(image_np)

    st.subheader("📜 OCR Text")

    st.text_area(
        "OCR Result",
        text,
        height=300
    )

    # --------------------------------------------------------
    # PARSE
    # --------------------------------------------------------

    parser = LedgerParser()

    result = parser.parse(text)

    st.subheader("📦 Parsed JSON")

    st.json(result)

    # --------------------------------------------------------
    # DOWNLOAD JSON
    # --------------------------------------------------------

    json_data = json.dumps(
        result,
        indent=4,
        ensure_ascii=False
    )

    st.download_button(
        label="⬇ Download JSON",
        data=json_data,
        file_name="ledger_output.json",
        mime="application/json"
    )