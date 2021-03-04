from theme_janitor import remove_theme_artifiacts
from themes import themes
from theme_installer import install_theme_styles

from argument_suggestion import suggest_theme


def list_themes():
    print("Theme Names (include double quotes): \n   {}".format('\n   '.join(
        map(lambda tuple: '"{}"'.format(tuple[0]), themes.items()),
    )))


def remove_theme():
    remove_theme_artifiacts()


def install_theme(theme_parameter):
    """
    Finna install the selected theme
    """
    if theme_parameter not in themes:
        print(
            "Unknown Theme \"{}\", did you mean \"{}\" ?".format(
                theme_parameter,
                suggest_theme(theme_parameter)
            )
        )
        return -1

    install_theme_styles(themes[theme_parameter])

    return 0
