import dokithemejupyter.theme_manager as theme_manager
from dokithemejupyter.arguments import parser


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
            arguments.sticker,
        )))
