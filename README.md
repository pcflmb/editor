# Coding in the Dark Editor
This repo is forked from the original editor, which hasn't seen significant updates in years. This version of the editor has quite a few upgrades:
* Converted from CoffeeScript to TypeScript (not a lot of types yet, but it's getting there)
* Upgrades dependencies to modern versions (Webpack v1 -> v4, Gulp v3 -> v4, etc.)
* [TODO] Make editor collaborative
* [TODO] Include an optional server to manage competitions

Read more about the Code in the Dark competition [here](https://github.com/codeinthedark/codeinthedark.github.io)*

## Lobby
There is a lobby screen that contestants see prior to starting their 15 minute timer.
![image](http://i64.tinypic.com/s5enif.jpg)

## Editor
![image](https://cloud.githubusercontent.com/assets/688415/11479175/f3aedfbe-9790-11e5-9ad9-ce930fe5a3a8.png)

## How to Use
* Grab the contents of the [`dist/`](https://github.com/codeinthedark/editor/tree/master/dist) folder, or download [this zip](https://github.com/codeinthedark/editor/releases/download/v0.1.0/editor.zip). All contestants should be given a copy of the editor.
* Replace `assets/page.png` in the editor files with a screenshot of the page that is to be built in the competition. 
* Add any extra assets (e.g. images) that are required to build the page in the `assets/` folder.
* Edit the `assets/instructions.html` file with information about the extra assets and their dimensions.

## Developing
Here's how to install the dependencies and run the editor locally:
```bash
$ yarn
$ yarn start
```
Or, with `npm`:
```bash
$ npm install
$ npm start
```

This will compile all scripts and styles and inline them into a single html file in the `dist/` folder. It will also create a `dist/assets/` folder, which separately contains the instructions and page screenshot so that they can easily be changed between different rounds of the competition.

## Contributing
Contributions to the editor welcome. If you've fixed a bug or implemented a cool new feature that you would like to share, please feel free to open a pull request here.
