import os

from jupyter_core.paths import jupyter_config_dir, jupyter_data_dir

# path to local site-packages (dokithemejupyter)
local_package_path = os.path.dirname(os.path.realpath(__file__))

user_config_path = os.path.join(os.path.expanduser('~'), '.doki-theme-jupyter')

# path to install custom.css file (~/.jupyter/custom/)
jupyter_home_path = jupyter_config_dir()
jupyter_data_path = jupyter_data_dir()

jupyter_custom_config_path = os.path.join(jupyter_home_path, 'custom')
jupyter_custom_fonts_path = os.path.join(jupyter_custom_config_path, 'fonts')
jupyter_customcss_path = os.path.join(jupyter_custom_config_path, 'custom.css')
jupyter_customjs_path = os.path.join(jupyter_custom_config_path, 'custom.js')
jupyter_nbext_path = os.path.join(jupyter_data_path, 'nbextensions')

# theme colors, layout, and font directories
layouts_dir = os.path.join(local_package_path, 'layout')
styles_dir = os.path.join(local_package_path, 'styles')
styles_dir_user = os.path.join(user_config_path, 'styles')
fonts_path = os.path.join(local_package_path, 'fonts')
version_file_path = os.path.join(local_package_path, 'version.txt')
default_styles_path = os.path.join(local_package_path, 'defaults')

current_theme_path = os.path.join(jupyter_custom_config_path, 'current_theme.txt')

# default custom.css/js files to override JT on reset
default_css_path = os.path.join(default_styles_path, 'custom.css')
default_js_path = os.path.join(default_styles_path, 'custom.js')

default_theme = 'Re:Zero: Rem'
