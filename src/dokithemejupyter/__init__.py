import dokithemejupyter.theme_manager as theme_manager
from dokithemejupyter.arguments import parser


class InstallOptions:
    def __init__(self, install_sticker, disable_wallpaper):
        self.install_sticker = install_sticker
        self.install_wallpaper = not disable_wallpaper


def main():
    arguments = parser.parse_args()

    if arguments.list:
        theme_manager.list_themes()
        exit(0)
    elif arguments.version:
        theme_manager.display_current_version()
        exit(0)
    elif arguments.remove:
        theme_manager.remove_theme()
        exit(0)
    else:
        exit(theme_manager.install_theme((
            arguments.set_theme,
            InstallOptions(
                arguments.sticker,
                arguments.disable_wallpaper
            )
        )))
