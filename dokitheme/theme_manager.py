from themes import themes

def list_themes():
  print( "Available Themes: \n   {}".format('\n   '.join(themes)))

def remove_theme():
  print('finna remove')

def install_theme(theme_parameter):
  """
  Finna install the selected theme
  """
  if(theme_parameter not in themes):
    print("Bro what am I supposed to do with this: {}?".format(theme_parameter))
    return -1
  
  print("Finna install {}".format(theme_parameter))
  return 0
