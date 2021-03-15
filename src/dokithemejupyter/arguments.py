from argparse import ArgumentParser

from dokithemejupyter.constants import default_theme

parser = ArgumentParser()
parser.add_argument(
    '-l',
    '--list',
    action='store_true',
    help='list available themes'
)
parser.add_argument(
    '-t',
    '--set-theme',
    default=default_theme,
    metavar='theme',
    action='store',
    help='name of theme to install'
)
parser.add_argument(
    '-f',
    "--set-font",
    action='store_true',
    help="install official doki theme font"
)
parser.add_argument(
    '-uf',
    '-rf',
    "--remove-font",
    "--uninstall-font",
    action='store_true',
    help="uninstalls official doki theme font"
)
parser.add_argument(
    '-u',
    '-r',
    '--remove',
    '--uninstall',
    action='store_true',
    help='restores previous styling'
)
