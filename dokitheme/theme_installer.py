import os
import sys
from tempfile import mkstemp

import lesscpy

from constants import jupyter_customcss_path, styles_dir
from file_system_tools import ensure_directories_exist
from theme_janitor import remove_theme_artifacts

_, evaluated_less_file = mkstemp('.less')


def create_theme_styles(theme_id):
    with open_file(os.path.join(styles_dir, 'themes', theme_id + '.less'), 'r') as base_styles:
        styles = base_styles.read() + '\n'

    with open_file(os.path.join(styles_dir, 'base.less'), 'r') as base_styles:
        styles += base_styles.read() + '\n'

    with open_file(evaluated_less_file, 'w') as evaluated_less:
        evaluated_less.write(styles)

    return lesscpy.compile(evaluated_less_file) + '\n\n'


def install_theme(theme_definition):
    css_string = create_theme_styles(theme_definition['id'])
    write_final_css(css_string)


def install_theme_styles(theme_definition):
    remove_theme_artifacts()
    ensure_directories_exist()
    install_theme(theme_definition)


def write_final_css(css_as_string):
    with open_file(jupyter_customcss_path, 'w') as custom_css:
        custom_css.write(css_as_string)


def open_file(filename, mode):
    if sys.version_info[0] == 3:
        return open(filename, mode, encoding='utf8', errors='ignore')
    else:
        return open(filename, mode)
