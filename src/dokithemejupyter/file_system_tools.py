import os

from dokithemejupyter.constants import jupyter_home_path, jupyter_custom_config_path, jupyter_custom_fonts_path, \
    jupyter_data_path, jupyter_nbext_path


def ensure_directories_exist():
    if not os.path.isdir(jupyter_home_path):
        os.makedirs(jupyter_home_path)
    if not os.path.isdir(jupyter_custom_config_path):
        os.makedirs(jupyter_custom_config_path)
    if not os.path.isdir(jupyter_custom_fonts_path):
        os.makedirs(jupyter_custom_fonts_path)
    if not os.path.isdir(jupyter_data_path):
        os.makedirs(jupyter_data_path)
    if not os.path.isdir(jupyter_nbext_path):
        os.makedirs(jupyter_nbext_path)