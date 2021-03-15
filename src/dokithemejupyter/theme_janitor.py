import os
from shutil import copyfile

from dokithemejupyter.constants import jupyter_custom_config_path, jupyter_nbext_path, default_css_path, \
    jupyter_customcss_path, jupyter_customjs_path, default_js_path, current_theme_path, jupyter_custom_fonts_path
from dokithemejupyter.file_system_tools import ensure_directories_exist


def remove_theme_artifacts():
    """Remove custom.css and custom fonts"""
    paths = [jupyter_custom_config_path, jupyter_nbext_path]

    for file_path in paths:
        custom = '{0}{1}{2}.css'.format(file_path, os.sep, 'custom')
        try:
            os.remove(custom)
        except Exception:
            pass
    try:
        delete_font_files()
    except Exception:
        ensure_directories_exist()
        delete_font_files()

    copyfile(default_css_path, jupyter_customcss_path)
    copyfile(default_js_path, jupyter_customjs_path)

    if os.path.exists(current_theme_path):
        os.remove(current_theme_path)


def delete_font_files():
    for fontfile in os.listdir(jupyter_custom_fonts_path):
        abspath = os.path.join(jupyter_custom_fonts_path, fontfile)
        os.remove(abspath)
