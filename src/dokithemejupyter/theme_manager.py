from dokithemejupyter.constants import current_theme_path, default_theme, version_file_path
from dokithemejupyter.theme_janitor import remove_theme_artifacts
from dokithemejupyter.themes import themes
import os
from dokithemejupyter.theme_installer import install_theme_styles, open_file

from dokithemejupyter.argument_suggestion import suggest_theme


def display_current_version():
    if os.path.exists(version_file_path):
        with open_file(version_file_path, 'r') as current_version:
            print("Doki Theme: Jupyter Notebook v{}".format(current_version.readlines()[0]))


def list_themes():
    print("Theme Names (include double quotes): \n   {}".format('\n   '.join(
        map(lambda theme_name: '"{}"'.format(theme_name[0]), sorted(themes.items(), key=lambda theme_name: theme_name[0])),
    )))


def get_current_theme():
    current_theme = read_current_theme()
    return themes[current_theme]


def read_current_theme():
    if os.path.exists(current_theme_path):
        with open_file(current_theme_path, 'r') as current_theme_file:
            current_theme = current_theme_file.readlines()[0]
    else:
        current_theme = default_theme
    return current_theme


def remove_theme():
    remove_theme_artifacts()
    print("""
    Removed themes, see you later friend!\nRefresh your browser to see changes.
    """.strip())


def install_theme(theme_install_parameters):
    theme_parameter, install_sticker = theme_install_parameters
    if theme_parameter is None:
        theme_parameter = read_current_theme()
    elif theme_parameter not in themes:
        print(
            "Unknown Theme \"{}\", did you mean \"{}\" ?".format(
                theme_parameter,
                suggest_theme(theme_parameter)
            )
        )
        return -1

    install_theme_styles(themes[theme_parameter], install_sticker)

    write_current_theme(theme_parameter)

    print("I installed \"{}\" refresh your notebook's browser to see changes!".format(theme_parameter))
    return 0


def write_current_theme(theme_parameter):
    with open_file(current_theme_path, 'w') as current_theme:
        current_theme.write(theme_parameter)
