import matplotlib as plotter
from dokitheme.themes import themes
from cycler import cycler


def decorate_plotter():
    doki_theme = themes['OreGairu: Yukinoshita Yukino']
    colors_ = doki_theme['colors']
    info_foreground_ = colors_['infoForeground']
    header_color_ = colors_['headerColor']
    plotter.rcParams.update({
        'figure.facecolor': header_color_,
        'figure.edgecolor': header_color_,
        'savefig.facecolor': header_color_,
        'savefig.edgecolor': header_color_,
        'axes.facecolor': header_color_,
        'axes.edgecolor': header_color_,
        'axes.labelcolor': info_foreground_,
        'text.color': info_foreground_,
        'xtick.color': info_foreground_,
        'ytick.color': info_foreground_,
        'axes.prop_cycle': cycler(
            color=[
                colors_['editorAccentColor'],
                colors_['keywordColor'],
                colors_['stringColor'],
                colors_['htmlTagColor'],
                colors_['classNameColor'],
                colors_['keyColor'],
                colors_['terminal.ansiRed'],
                colors_['terminal.ansiGreen'],
                colors_['terminal.ansiYellow'],
                colors_['terminal.ansiBlue'],
                colors_['terminal.ansiMagenta'],
                colors_['terminal.ansiCyan'],
            ]
        )
    })
