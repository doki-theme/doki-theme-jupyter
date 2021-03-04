from themes import themes
from Levenshtein import distance


def suggest_theme(unknown_theme):
    keys = list(themes.keys())
    closest_match = keys[0]
    min_distance = distance(unknown_theme, closest_match)

    for theme_name in keys:
        this_distance = distance(unknown_theme, theme_name)
        if(this_distance <= min_distance):
            min_distance = this_distance
            closest_match = theme_name

    return closest_match
