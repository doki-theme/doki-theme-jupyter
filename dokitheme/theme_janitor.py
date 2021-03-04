import os
from shutil import copyfile

from constants import jupyter_custom_config_path, jupyter_nbext_path, default_css_path, \
    jupyter_customcss_path, jupyter_customjs_path, default_js_path, current_theme_path, jupyter_home_path, \
    jupyter_custom_fonts_path, jupyter_data_path


def remove_theme_artifiacts():
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

    print("""
    Removed themes, see you later friend!\nRefresh your browser to see changes.
    """.strip())


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


def delete_font_files():
    for fontfile in os.listdir(jupyter_custom_fonts_path):
        abspath = os.path.join(jupyter_custom_fonts_path, fontfile)
        os.remove(abspath)
