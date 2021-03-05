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
body::before {
    content: '';
    pointer-events: none;
    position: absolute;
    z-index: 9001;
    width: 100%;
    height: 100%;
    background-position: 100% 100%;
    background-image: url("https://doki.assets.unthrottled.io/stickers/jetbrains/v2/franxx/zeroTwo/dark/zero_two_dark.png");
    background-repeat: no-repeat;
    opacity: 1;
}
#notebook-container {
  margin-bottom: 10rem;
}
* { 
  background-image: url('https://doki.assets.unthrottled.io/backgrounds/wallpapers/transparent/zero_two_dark.png') !important;
  background-repeat: no-repeat !important;
  background-attachment: fixed !important;
  background-position: center !important; 
  background-size: cover !important;
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
