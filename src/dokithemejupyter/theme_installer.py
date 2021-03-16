import os
import sys
from shutil import copyfile
from tempfile import mkstemp

import lesscpy

from dokithemejupyter.constants import jupyter_customcss_path, styles_dir, fonts_path, jupyter_custom_fonts_path, jupyter_customjs_path
from dokithemejupyter.file_system_tools import ensure_directories_exist
from dokithemejupyter.theme_janitor import remove_theme_artifacts

_, evaluated_less_file = mkstemp('.less')


def create_theme_styles(theme_id, install_sticker):
    with open_file(os.path.join(styles_dir, 'themes', theme_id + '.less'), 'r') as base_styles:
        styles = base_styles.read() + '\n'

    with open_file(os.path.join(styles_dir, 'base.less'), 'r') as base_styles:
        styles += base_styles.read() + '\n'

    if install_sticker:
        with open_file(os.path.join(styles_dir, 'sticker.less'), 'r') as base_styles:
            styles += base_styles.read() + '\n'

    with open_file(evaluated_less_file, 'w') as evaluated_less:
        evaluated_less.write(styles)

    return lesscpy.compile(evaluated_less_file) + '\n\n'


def install_theme(theme_definition, install_sticker):
    css_string = create_theme_styles(theme_definition['id'], install_sticker)
    write_final_css(css_string)


def copy_fonts():
    for fontfile in os.listdir(fonts_path):
        copyfile(os.path.join(fonts_path, fontfile),
                 os.path.join(jupyter_custom_fonts_path, fontfile))


def install_javascript(theme_definition):
    colors_ = theme_definition['colors']
    write_final_javascript("""
        terminal.term.setOption('theme', {{
  foreground:    '{}',
  background:    '{}',
  black:         '{}',
  brightBlack:   '{}',
  red:           '{}',
  brightRed:     '{}',
  green:         '{}',
  brightGreen:   '{}',
  yellow:        '{}',
  brightYellow:  '{}',
  blue:          '{}',
  brightBlue:    '{}',
  magenta:       '{}',
  brightMagenta: '{}',
  cyan:          '{}',
  brightCyan:    '{}',
  white:         '{}',
  brightWhite:   '{}',
}});""".format(
        colors_['foregroundColor'],
        colors_['textEditorBackground'],
        "#000000",
        "#000000",
        colors_['terminal.ansiRed'],
        colors_['terminal.ansiRed'],
        colors_['terminal.ansiGreen'],
        colors_['terminal.ansiGreen'],
        colors_['terminal.ansiYellow'],
        colors_['terminal.ansiYellow'],
        colors_['terminal.ansiBlue'],
        colors_['terminal.ansiBlue'],
        colors_['terminal.ansiMagenta'],
        colors_['terminal.ansiMagenta'],
        colors_['terminal.ansiCyan'],
        colors_['terminal.ansiCyan'],
        "#ffffff",
        "#ffffff",
    ))


def write_final_javascript(javascript_as_string):
    with open_file(jupyter_customjs_path, 'w') as custom_css:
        custom_css.write(javascript_as_string)


def install_theme_styles(theme_definition, install_sticker):
    remove_theme_artifacts()
    ensure_directories_exist()
    install_theme(theme_definition, install_sticker)
    copy_fonts()
    install_javascript(theme_definition)


def write_final_css(css_as_string):
    with open_file(jupyter_customcss_path, 'w') as custom_css:
        custom_css.write(css_as_string)


def open_file(filename, mode):
    if sys.version_info[0] == 3:
        return open(filename, mode, encoding='utf8', errors='ignore')
    else:
        return open(filename, mode)
