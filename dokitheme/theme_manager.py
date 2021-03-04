from themes import themes

def list_themes():
  print( "Theme Names: \n   {}".format('\n   '.join(
    map(lambda tuple: tuple[0], themes.items()),
  )))

def remove_theme():
    print('finna remove')


def install_theme(theme_parameter):
    """
    Finna install the selected theme
    """
    if(theme_parameter not in themes):
        print("Bro what am I supposed to do with this: {}?".format(theme_parameter))
        return -1

    theme_id = themes[theme_parameter]
    print("Finna install {} with id {}".format(theme_parameter, theme_id))
    return 0
