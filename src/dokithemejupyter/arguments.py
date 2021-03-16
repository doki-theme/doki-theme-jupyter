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
    metavar='theme',
    action='store',
    help='name of theme to install'
)
parser.add_argument(
    '-s',
    '--sticker',
    action='store_true',
    help='installs sticker'
)
parser.add_argument(
    '-u',
    '-r',
    '--remove',
    '--uninstall',
    action='store_true',
    help='restores previous styling'
)
parser.add_argument(
    '-v',
    '--version',
    action='store_true',
    help='current version of the theme'
)
