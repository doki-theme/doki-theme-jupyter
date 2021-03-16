The Doki Theme: Jupyter Notebook
---

## Quick Theme Preview

![Themes](./readmeAssets/quick_theme_preview.webp)


# [More Screenshots](./albums/screenshot_album.md)

**About** 

Does your Jupyter Notebook need more anime girls?
Crunch data with your waifu. With over **30** themes,
I think you will find best girl.
This plugin is for serious Otaku data enthusiasts.

---

# Documentation

- [Installation](#installation)
    - [Requirements](#pre-requisites)  
    - [Package Install](#package-install)
- [Usage](#usage)
  - [CLI](#command-line-interface)
  - [Python API](#python-api)
    - [Decorator](#decorator)
- [Miscellaneous](#miscellaneous)
    - [Theme Requests](#theme-requests)
    - [Helping the community](#enjoying-the-plugin)
    - [Feature Requests](#contributions)

# Quick Start!

I've put together a [demo notebook](./index.ipynb) that demonstrates the core functionality of the `doki-theme-jupyter` package.

# Installation 

### Pre-Requisites

For the optimal experience it's best you have:

- [Doki Theme Web](https://github.com/doki-theme/doki-theme-web)
- Jupyter Notebook >=6.0.0
- Python >=3.7
- pip 21.0 >= (Just having pip should suffice)

### Package Install

The Doki Theme for Jupyter Notebook provides a command line interface.
Which enables you decorate your notebook from your shell or notebook!

To install the package just run this command:

```shell
pip install dokithemejupyter
```

# Usage

The Doki Theme for Jupyter Notebook has a few components.
The following sections are dedicated to explaining theme in detail.

## Command Line Interface 

Now that you have `dokithemejupyter` available, here's what each of the options does!

**Help**

```shell
dokithemejupyter --help
```

This command will show you all the available features the CLI provides.
The rest of the sections below are dedicated to explaining each in detail.

**List**

```shell
dokithemejupyter --list
```

Wow! That's a bunch of themes! This command will output all the available themes to install.
**Important**, theme arguments are exact match and require the `"""`, don't forget to add those!


**Set Theme**

```shell
dokithemejupyter --set-theme "Franxx: Zero Two Dark"
```

This is the most important command, which enables the decoration of your notebook with your waifu!
**Important**, theme arguments are exact match and require the `"""`, don't forget to add those!

**Sticker**

```shell
dokithemejupyter --sticker --set-theme "Franxx: Zero Two Dark"
```

This installs your selected theme with the cute sticker in the righthand corner.
Running a set theme command without the sticker parameter will remove the sticker.

```shell
dokithemejupyter --sticker
```

Will only install the sticker for the current theme.

**Remove**

```shell
dokithemejupyter --remove
```

Sad to see you go, I'll be seeing you around friend!
This command removes all the notebook decoration and restores the defaults.

**Version**

```shell
dokithemejupyter --version
```
You keep your packages up to date right?
Well you don't want to miss any updates, you might be missing some girls!

## Python API

Your otaku experience is not complete without a little extra decoration.

### Decorator

This is a python API that will color [matplotlib's](https://matplotlib.org/)
plotter to your currently selected theme. 
That way all of your data visualizations match your favorite girl.

```python
from dokithemejupyter import decorator
decorator.decorate_plotter()
```

You'll just need to have this code get run once before you do any plotting.

# Miscellaneous

## Theme Requests

If you want your main squeeze to be featured in the Doki Theme suite, feel free to [submit a theme request](https://github.com/doki-theme/doki-master-theme/issues).

## Enjoying the themes?

Great! I am glad you like it!

Be sure to ⭐ and share it with other weebs!

## Contributions?

I think your voice needs to be heard! You probably have good ideas, so feel free to submit your feedback as [an issue](https://github.com/doki-theme/doki-theme-jupyter/issues/new).

Help make this plugin better!

