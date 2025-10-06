# app.py
import streamlit as st

st.set_page_config(page_title="Ayush Juyal — Portfolio", layout="wide")

# 👉 After you enable GitHub Pages for this repo (Settings → Pages → Deploy from branch → main /root),
#    your site URL will be: https://ayush009.github.io/ayushjuyal.dev/
PAGES_URL = "https://ayush009.github.io/ayushjuyal.dev/"

st.markdown(
    """
    <style>
      .stApp iframe { width: 100%; border: none; }
      /* remove extra top padding for a tighter look */
      .block-container { padding-top: 0rem; }
    </style>
    """,
    unsafe_allow_html=True,
)

st.components.v1.iframe(PAGES_URL, height=2000, scrolling=True)
