from dokithemejupyter.themes import themes
from Levenshtein import distance


def suggest_theme(unknown_theme):
    theme_display_names = list(themes.keys())
    return find_min(
        unknown_theme,
        theme_display_names[0],
        theme_display_names,
        [
            lambda themeName: themeName,
            lambda themeName: themeName.split(": ")[1]
        ]
    )


def find_min(
    target,
    provided_closest_match,
    list_to_search,
    candidate_decorators
):
    min_distance = distance(target, provided_closest_match)

    for theme_name in list_to_search:
        for decorator in candidate_decorators:
            this_distance = distance(target, decorator(theme_name))
            if(this_distance <= min_distance):
                min_distance = this_distance
                closest_match = theme_name

    return closest_match
