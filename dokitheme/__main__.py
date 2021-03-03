from argparse import ArgumentParser

parser = ArgumentParser()
parser.add_argument(
        '-l',
        "--list",
        action='store_true',
        help="list available themes"
)
arguments = parser.parse_args()
