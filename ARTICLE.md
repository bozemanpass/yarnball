# Yarnball: Yarn and NPM Versions Demystified

> By Thomas E Lackey

![Prototype](img/cat.jpg)

Most of the time, adding a Javascript library or package using [yarn](https://yarnpkg.com/) (or [npm](https://www.npmjs.com/get-npm)) is as simple as
typing `yarn add the-pkg-i-want` to get the latest version.

But this article is not about that. This article is for when things are no longer so simple.

To really understand what happens during package resolution, the actual code [yarn](https://yarnpkg.com/) uses to decide amongst package
versions needs to be executed against a live NPM registry and real, published packages, which is exactly what we are going
to do in this article.

### Semantic Versioning

First, there needs to a quick introduction to the NPM package versioning scheme, called Semantic Versioning, or SemVer
for short.  The full specification is available at [semver.org](https://semver.org), but the basic approach can be summarized
briefly: versions are numeric, in the form _MAJOR.Minor.patch_.  _MAJOR_ represents a breaking change, something incompatible with previous versions.  _Minor_ indicates new
features added in a backwards-compatible way.  Lastly, _patch_ indicates a bug fix. Each of these fields must be a
non-negative integer, where higher values represent later versions.

If the current version of a package is 1.0.0, add the developer would like to publish an update, 
the next bug fix (_patch_) would be 1.0.1, the next feature release (_Minor_) 1.1.0, 
and the next release that changes how things work would be (_MAJOR_) would be 2.0.0.

When a package is added using `yarn add`, its version is automatically inserted in the `package.json` file like so:

```
  "dependencies": {
    "the-pkg-i-want": "^1.0.0"
  }
```

The `^` symbol instructs the package resolver, "I want the highest _compatible_ match greater than or equal to the following version."
Today that might be 1.0.0, as above, but in the future could easily be 1.1.1, or even 1.17.33.  Using a `^` is the most
common way to specify a version range, but not the only one.  For more about version ranges and the many ways to specify
them, read [Advanced Range Syntax](https://github.com/npm/node-semver#advanced-range-syntax) from the
[node-semver](https://github.com/npm/node-semver) project.

## Where Things Begin to Get Complicated

That only seems to be part of the picture though.  You have probably seen many packages where the version numbers were more like 0.4.1 or
1.3.9-beta.4. And what is happening when running something like `yarn add react@next`?

### Initial Development Versions - 0.x.y

The SemVer spec mentions that a _MAJOR_ version of 0 can be used for "initial development."  What counts as initial
development?  In the context of SemVer, it indicates, "Anything MAY change at any time. The public API SHOULD NOT be considered stable."

That is clear enough as far as it goes, but what does it mean when matching versions?
What range of versions would we expect ^0.1.0 to match?  What about ^0.0.2?

The sure way to find out is to try it, but only if what you try truly uses [yarn](https://yarnpkg.com/), communicates with a live
NPM registry, and searches for a real package.  All of the following examples do exactly that.  For this
article, we have made it possible to run yarn's package resolution logic in the browser, so that the results
you see will be identical to those on the command line, because it is using the same code as the command line.

> All the package queries are executed live, so you can experiment with any other packages and versions
> by editing the parameters to the examples.  In the results, an orange highlight designates the chosen version,
> green a SemVer-match that was _not_ chosen, and grey an unmatched version.

<div id="example-IDV-A"></div>

You might have expected that ^0.1.0 would have matched everything 0._x_._y_ (where _x_ > 1), but in fact, it only
matched to 0.1.0 and 0.1.1.  And ^0.0.2 did not match anything at all but 0.0.2.  But why?

In practice, when using a range like `^` it is the first _non-zero_ digit that is really treated as the _MAJOR_ version,
the part of the SemVer that signifies a breaking change.  So just as ^1.0.0 would not match the new _MAJOR_ version 2.0.0,
neither will ^0.1.0 will match 0.2.0. Perhaps more surprisingly, a version of the form 0.0._n_ causes _every_ version to
appear to contain _MAJOR_, breaking changes, rendering the `^` range operator completely moot.

### Registry Tags - x.y.z@bar

Whenever a package version is published, it is assigned a "package distribution tag".  If no tag is specified
explicitly, then the package will be assigned the "latest" tag _implicitly_.  The "latest" tag is quite special, which
we will examine shortly.

> NOTE:  Tags are sometimes referred to as channels in older documentation.  See [npm-dist-tag](https://docs.npmjs.com/cli/v6/commands/npm-dist-tag)
> for more information on tagging in general.

Tags are frequently used to make versions that are not quite ready for general release available
to the public for testing.  The tags "alpha" and "beta" are common, and also "next" such as `react-native@next`, but
since tag values are arbitrary many others might be encountered.

During package installation, tags are integral to the version resolution process even when not specified explictly.
Executing `yarn add mypkg` is implicitly a request for the "latest" version and so functionally equivalent to `yarn add mypkg@latest`.

For this example, we published a simple package with three versions and tags:

```
> npm dist-tags @bozemanpass/example
alpha: 1.0.1
beta: 1.0.2
latest: 1.0.0
```

For a package to make use it, it would have an entry in its `package.json` similar to:

```
  "dependencies": {
    "@bozemanpass/example": "^1.0.0"
  }
```

This does specify an explicit SemVer range, so given all of the SemVer matching rules examined so far, which version do you
expect [yarn](https://yarnpkg.com/) will select?

<div id="example-tag-A"></div>

But wait a moment, since the SemVer range 1.0.0 also matches 1.0.1 and 1.0.2. Why wasn't 1.0.2 chosen since
it is a highest compatible match of the three?  Something other than SemVer matching rules is obviously
at work.

In practice, the package resolution for both [yarn](https://yarnpkg.com/) and [npm](https://www.npmjs.com/get-npm) works like this:

1. Download information about all available versions of the package from the registry.

1. Check if the requested SemVer can be satisfied using the "latest" version; if so, use that and do not look at any
   other version.

1. If not, examine _everything_ and return the maximum version which satisfies the range, regardless of tag.

This is difficult to find documented, but you can [read the code](https://github.com/yarnpkg/yarn/blob/a4708b29ac74df97bac45365cba4f1d62537ceb7/src/resolvers/registries/npm-resolver.js#L51).

If that is the case, how do we get another package?  Suppose we would like to try 1.0.1@alpha, because it
contains a fix that we need, how can we get it?  How about asking for ^1.0.1?

<div id="example-tag-B"></div>

It worked, but it may have worked a bit better than expected.  It did not select 1.0.1@alpha,
it selected 1.0.2@beta.

Perhaps this would be OK in many cases, but if we really intended to try the "alpha" version, what about
trying again, this time explicitly specifying the "alpha" tag:

<div id="example-tag-C"></div>

Excellent!  That is exactly what we asked for, but it is important to note there is no sign of the "alpha" tag in
the `package.json` after running `yarn add '@bozemanpass/example@alpha'`:
```
> yarn add '@bozemanpass/example@alpha'
> cat package.json | jq '.dependencies'
{
  "@bozemanpass/example": "^1.0.1"
}
> cat node_modules/@bozemanpass/example/package.json | jq .version
"1.0.1"
```

But wait, from the previous example, don't we already know that ^1.0.1 normally resolves
to 1.0.2@beta?  Yes, it does, and it _will_ at its first opportunity, which is important
to keep in mind:

```
> yarn install --no-lockfile
> cat node_modules/@bozemanpass/example/package.json | jq .version
"1.0.2"
```

#### Tags Change

At this point The `package.json` specifies ^1.0.1, and that is being resolved to 1.0.2@beta.  What if the
package publisher is satisfied that 1.0.1 is stable and decides to make it the "latest" release?

```
# Add the "latest" tag to version 1.0.1.
> npm dist-tag add '@bozemanpass/example@1.0.1' latest

> yarn install --no-lockfile
> cat node_modules/@bozemanpass/example/package.json | jq .version
"1.0.1"
```
> NOTE: The package name for this live example is different, since before/after states need to be demonstrated.

<div id="example-tag-D"></div>

The version moved backwards!  Given the package resolution rules detailed above it does makes sense.

Before 1.0.1 was tagged "latest", the SemVer range could not be matched by "latest" version, and so it examined
all published versions, across all tags, and chose the maximum one.  But after the package was tagged, the range
could be matched to "latest", and so other versions were not even considered.

The manner in which tags affect version resolution, especially the "latest" tag, is one of the least
documented aspects of [yarn](https://yarnpkg.com/) and [npm](https://www.npmjs.com/get-npm), but as the examples show, one with many practical consequences.

### Pre-release Versions - x.y.z-a.b

The SemVer spec also allows for a "pre-release version" that can be indicated by adding an hyphen after the _patch_
portion, followed by "dot separated identifiers".  There are many forms this can take, but a common one is something like:
1.3.9-beta.4.

> NOTE: This "pre-release" portion is sometimes called a "preid".

Generally, pre-release versions are not matched unless specifically requested.   Given the following versions:

```
1.3.8
1.3.9-alpha.1
1.3.9-beta.4
1.3.9-rc.0
```

The range ^1.3.8 would not match any of the 1.3.9-_xyz_ pre-releases.  But which version would you
expect ^1.3.9-alpha.1 to match?  Better yet, why?

<div id="example-PR-A"></div>

A range that includes a pre-release version is resolved by looking for:

1. Higher versions in the whole compatible range that are _without_ a pre-release string (e.g. 1.3.10).
2. The highest _lexical_ pre-release string in exactly the same patch range.

So in this case, 1.3.9-alpha.1 will resolve to 1.3.9-rc.0, but not because "rc" stands for "release candidate",
or because it was published later, but simply because "r" comes after "a" in the alphabet.

If 1.3.10 is published down the road, ^1.3.9-alpha.1 would cease to resolve to the pre-release version and would
instead choose 1.3.10, since a regular version always has higher precendence than a pre-release.

For the package publisher there is another important quirk of pre-releases.  Since the pre-release
portion is baked into version it is a stumblingblock for "promoting" releases.
For example, if after sufficient testing we wanted to promote 1.3.9-rc.0 to be the new, default release we
could not simply tag it "latest", since it would still have "-rc.0" in its version.  Instead we would be forced to
republish a new version with a corrected version number.

## Command Line Tools

The core tools [yarn](https://yarnpkg.com/) and [npm](https://www.npmjs.com/get-npm) offer a lot of functionality, but they are also quite cumbersome for answering
some straightforward questions like, "What version would I get if I typed _this_?"

Web-based tools such as [npm semver calculator](https://semver.npmjs.com/) are more straightforward, but less capable and
more difficult to incorporate into a development workflow.  They can also yield occasionally results which are 
baffling even when correct (e.g. try it with the `@bozemanpass/example` package, and attempt to determine from the
information presented why 1.0.2 was not picked).

In the code supporting this article, we have included a few tools that aim to be both simple and capable.
They present the same package resolution code as the [yarn](https://yarnpkg.com/) project in a lightweight, standalone form.

* `yarnball` Resolves a single package name/version.
* `yarnball-deep` Resolves a package and all its dependencies, presented as a tree.
* `yarnball-list` Resolves a package and all its dependencies, presented as a list.
* `yarnball-multiples` Similar to `yarnball-list`, but only displays dependencies with multiple versions.

Unlike `yarn why`, these tools are stateless and can even be executed outside of any existing project.

All have the same usage: `yarnball <name> [semver]`.

Here is some example output:

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

But even better is to try it for yourself:

<div id="example-con-A"></div>

## The Sixty Second Version

* [yarn](https://yarnpkg.com/) and [npm](https://www.npmjs.com/get-npm) prefer to pick a package tagged "latest". If the specified range can be satisfied by
  the "latest" package, it will always be, even if an higher match is available.
  

* `^` range matches against initial development versions (0._x_._y_ or 0.0._y_) behave as if the first non-zero digit is the _MAJOR_
  version.


* `^` range matches against a pre-release version (e.g. 1.1.1-alpha.3) will not match any other pre-release version
  outside that exact _MAJOR.Minor.patch_ combination. They _will_ match lexically higher pre-releases with the
  same _MAJOR.Minor.patch_ and full releases across the entire compatible range. That is, the range ^1.1.1-alpha.3 will
  match 1.1.1-beta.5 or 1.1.2, but will _not_ match 1.1.2-beta.0.


* Versions with a pre-release portion should never be tagged "latest", since the pre-release portion will always remain
  in the version string; instead a new version should be published.


* Because version ranges, not tags, are normally used in `package.json`, it quite easy to hop tags.  Even if you added
  the package with `yarn add pkg@alpha`, later on a different version could easily be selected.

Package versioning for [yarn](https://yarnpkg.com/) and [npm](https://www.npmjs.com/get-npm) is a complicated subject which cannot be exhausted by one short article, but
these key points can help avoid confusion and surprises in your projects.

> &copy; 2021 Bozeman Pass, Inc.
> All Rights Reserved.
