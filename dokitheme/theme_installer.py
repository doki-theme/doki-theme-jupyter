import sys

from constants import jupyter_customcss_path
from theme_janitor import remove_theme_artifacts
from file_system_tools import ensure_directories_exist


def get_doki_theme(theme_id):
    return {
        "colors": {
            "fileScopeColor": "#ff0000"
        }
    }


def create_theme_styles(doki_theme):
    return """
    :root {
        --jp-layout-color1: red;
    }
    #jupyter-main-app {
    position: relative;
    background-color: red;
}
    """


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
