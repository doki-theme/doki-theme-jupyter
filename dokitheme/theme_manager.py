from themes import themes
from argument_suggestion import suggest_theme

def list_themes():
    print("Theme Names (include double quotes): \n   {}".format('\n   '.join(
        map(lambda tuple: '"{}"'.format(tuple[0]), themes.items()),
    )))


def remove_theme():
    print('finna remove')


def install_theme(theme_parameter):
    """
    Finna install the selected theme
    """
    if(theme_parameter not in themes):
        print(
            "Unknown Theme \"{}\", did you mean \"{}\" ?"
            .format(theme_parameter, suggest_theme(theme_parameter))
        )
        return -1

    theme_id = themes[theme_parameter]
    print("Finna install {} with id {}".format(theme_parameter, theme_id))
    return 0
