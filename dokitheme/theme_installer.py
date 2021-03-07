import sys, os

import lesscpy
from tempfile import mkstemp
from constants import jupyter_customcss_path, styles_dir
from theme_janitor import remove_theme_artifacts
from file_system_tools import ensure_directories_exist


def get_doki_theme(theme_id):
    return {
        "colors": {
            "fileScopeColor": "#ff0000"
        }
    }

# path to save tempfile with style_less before reading/compiling
_, tempfile = mkstemp('.less')
_, vimtemp = mkstemp('.less')

def create_theme_styles(doki_theme):
    with open_file(os.path.join(styles_dir, 'base.less'), 'r') as base_styles:
        styles = base_styles.read() + '\n'

    with open_file(tempfile, 'w') as evaluated_less:
        evaluated_less.write(styles)

    style_css = lesscpy.compile(tempfile)
    style_css += '\n\n'
    return style_css


def install_theme(theme_id):
    doki_theme = get_doki_theme(theme_id)
    css_string = create_theme_styles(doki_theme)
    write_final_css(css_string)


def install_theme_styles(theme_id):
    remove_theme_artifacts()
    ensure_directories_exist()
    install_theme(theme_id)


def write_final_css(css_as_string):
    with open_file(jupyter_customcss_path, 'w') as custom_css:
        custom_css.write(css_as_string)


def open_file(filename, mode):
    if sys.version_info[0] == 3:
        return open(filename, mode, encoding='utf8', errors='ignore')
    else:
        return open(filename, mode)
