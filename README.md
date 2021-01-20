# yarnball

npm versions demystified

## Live

Yarnball runs in the browser: [http://yarnball.pages.bozemanpass.com/yarnball.html](http://yarnball.pages.bozemanpass.com/yarnball.html)

## Install

```
yarn global add @bozemanpass/yarnball

# or

npm i -g @bozemanpass/yarnball
```

## Commands

* `yarnball` Resolves a single package name/version and reports its details.
* `yarnball-deep` Resolves a package and all its dependencies, presented as a tree.
* `yarnball-list` Resolves a package and all its dependencies, presented as a list.
* `yarnball-multiples` Similar to `yarnball-list`, but only displays dependencies with multiple versions.
* `yarnball-size` Report the number of total number of packages drawn in and their approximate size (if known).

All have similar usage: `yarnball[-deep|-list|-multiples-size] <name> [semver] [registryUrl]`.

Example output:

```
> yarnball log4js ^6.0.0
{
  "name": "log4js",
  "requested": "^6.0.0",
  "resolved": "6.3.0",
  "semver-satisfies": [
    "6.0.0",
    "6.1.0",
    "6.1.1",
    "6.1.2",
    "6.2.0",
    "6.2.1",
    "6.3.0"
  ],
  "tags": {
    "latest": "6.3.0"
  },
  "tarball": "https://registry.npmjs.org/log4js/-/log4js-6.3.0.tgz",
  "unpackedSize": 106197
}
```

For more information see: [http://yarnball.pages.bozemanpass.com](http://yarnball.pages.bozemanpass.com)
