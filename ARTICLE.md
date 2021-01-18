# Yarnball: npm versions demystified

> By Thomas E Lackey

![Prototype](img/cat.jpg)

Most of the time, adding a library or package as a dependency to a JavaScript project using [yarn](https://yarnpkg.com/) (or its ancestor [npm](https://www.npmjs.com/get-npm)) is as simple as
typing `yarn add the-pkg-i-want` to get the latest version.

But this article is not about that. This article is for when things aren't so simple.

To really understand exactly what happens during package resolution, there's no better way than to run the actual code [yarn](https://yarnpkg.com/) uses to decide amongst package
versions. That's exactly what we are going to do in this article. Literally. In this page, in your browser, querying the live npm registry.

### Semantic Versioning

First a quick primer on the npm package versioning scheme: [semantic versioning](https://docs.npmjs.com/about-semantic-versioning), or SemVer.
The full specification is available at [semver.org](https://semver.org), but
briefly &ndash; versions have the form _MAJOR.Minor.patch_ like: 1.0.0.  _MAJOR_ represents a breaking change, something incompatible with previous versions.  _Minor_ indicates new
features added in a backwards-compatible way.  Lastly, _patch_ indicates a bug fix. Each of these fields must be a
non-negative integer, where higher values represent later versions.

The idea is that if, say, the current version of a package is 1.0.0, then if its developer needs to publish an updated package; 
the next bug fix (_patch_) version would be 1.0.1; the next feature release version (_Minor_) 1.1.0;
and the next release that changes how things work would be (_MAJOR_) would have version 2.0.0.

But this semantic versioning scheme isn't just used by package publishers to communicate their intentions with new releases. There's a second half to the story:
When a dependent package is added to a project using `yarn add`, its latst version (more on that later) is automatically inserted in the `package.json` file like so:

```
  "dependencies": {
    "the-pkg-i-want": "^1.0.0"
  }
```

The `^` symbol specifies a _version range_ and says, "I want the highest _compatible_ match greater than or equal to this version."
Today that might be 1.0.0, but in the future could easily be 1.1.1, or even 1.17.33. It's important to note that `^` and friends are an [invention of npm and yarn](https://docs.npmjs.com/cli/v6/using-npm/semver#advanced-range-syntax), not
mentioned anywhere in the SemVer specification itself.

The version downloaded from the registry and used by the dependent package is
selected through a process called _version resolution_, the result of which depends on both the specified version range, and the set of published versions at the time of resolution.
Exactly which version is resolved, and why, can be counterintuitive and non-obvious. Read on.

## Where Things Begin to Get Complicated

Let's take the training wheels off and ask questions like &ndash; what's special about this version: 0.4.1?, or this:
1.3.9-beta.4? And what is happening here: `yarn add react@next`?

### Zero is special &ndash; 0.x.y

The [spec](https://semver.org) mentions that a _MAJOR_ version of 0 can be used for "initial development."  What counts as initial
development?  In the context of SemVer, it indicates, "Anything MAY change at any time. The public API SHOULD NOT be considered stable."

That is clear enough as far as it goes, but does it mean anything when resolving versions with npm and yarn? 
What version would ^0.1.0 resolve?  What about ^0.0.2? The fact that zero gets particular mention gives a hint that
something probably special happens but the [npm documentation](https://docs.npmjs.com/cli/v6/using-npm/semver#caret-ranges-123-025-004) isn't exactly clear.

The one sure way to find out is to try it &ndash; perhaps find a package published with a diverse set of versions, create a dependent package specifying
^0.1.0, then run `yarn install` and finally run `yarn why`.

But we don't need to do all that because for this article, because it possible to run yarn's package resolution logic in the browser with the "yarnball widget": the results
you see will be identical to those on the command line &ndash; because it is using the same code as the command line.
When you press the "Try It" button below, the
[code that deals with package resolution](https://github.com/bozemanpass/yarnball/tree/main/src/yarn) in [yarn](https://yarnpkg.com/) is executed. 
It communicates with a live
npm registry, retrieves package metadata for a [package published for the purpose](https://www.npmjs.com/package/@bozemanpass/hairball) featuring an interesting set of versions, 
then highlights the version yarn would resolve.

> Resolution queries are executed live, so you can experiment with any other packages and versions
> by editing the parameters to the examples.  In the results, an orange highlight designates the resolved version,
> green a version that satisfied the range but was _not_ resolved, and grey a version not satisfying the range.

<div id="example-IDV-A"></div>

You might have expected that ^0.1.0 would have resolved 0.10.0 by matching everything 0._x_._y_ (where _x_ > 1), but in fact, it only
resolved 0.1.1 by matching only 0.1.0 and 0.1.1 even though 0.2-10.x exist. And if you try ^0.0.2 you'll see that it resolved 0.0.2 and didn't match 0.0.3-5.  But why?

In practice, when a  `^` range is specified, it is the _leading_ _non-zero_ digit that is really treated as if it were the _MAJOR_ version,
(the part of the SemVer that signifies a breaking change).  So just as ^1.0.0 would not match a new _MAJOR_ version 2.0.0,
neither will ^0.1.0 will match 0.2.0. Perhaps more surprisingly, a version of the form 0.0._n_ causes _every_ version to
appear to contain _MAJOR_, breaking changes, rendering the `^` range operator completely moot.

The bottom line is that "zero is special". Some developers like to just never publish with a zero version, ensuring that their life will be free at least of this one complication.

### Registry Tags - x.y.z@bar

Whenever a package version is published, it is assigned a "package distribution tag" by the registry. Tags aren't mentioned in either the
SemVer spec, or npm's version range resolution documentation, but that doesn't mean you can ignore them. If no tag is specified
explicitly, then the package will be assigned the default tag "latest". Tags are unique so if a previous version had been
tagged "latest", now it isn't. The "latest" tag is quite special, which we will examine shortly.

Besides the special "latest", other tags are frequently used to indicate versions that are not quite ready for general release.
The tags "alpha" and "beta" are common, and also "next".
> Tags are sometimes referred to as channels in older documentation.  See [npm-dist-tag](https://docs.npmjs.com/cli/v6/commands/npm-dist-tag)
> for more information on tagging in general.

A tag may be specified for package installation using the `@` syntax, like `yarn add react@experimental`.
It's important to know that during package installation tags are integral to the version resolution process even when not specified explicitly.
For instance, executing `yarn add mypkg` is implicitly a request for the "latest" version and so functionally equivalent to `yarn add mypkg@latest`.

For this example, we'll use [a package](https://www.npmjs.com/package/@bozemanpass/example) with three versions and tags:

```
> npm dist-tags @bozemanpass/example
alpha: 1.0.1
beta: 1.0.2
latest: 1.0.0
```

A dependent package would have an entry in its `package.json` similar to:

```
  "dependencies": {
    "@bozemanpass/example": "^1.0.0"
  }
```

This does specify an explicit SemVer range, so given all of the SemVer matching rules examined so far, which version do you
expect [yarn](https://yarnpkg.com/) will select?

> Yarnball annotates displayed versions with any tag assigned, as an @tag suffix.

<div id="example-tag-A"></div>

But wait a moment, since the SemVer range 1.0.0 also matches 1.0.1 and 1.0.2. Why wasn't 1.0.2 chosen since
it is a highest compatible match of the three?  Something other than SemVer matching rules is obviously
at work.

In practice, the package resolution for both [yarn](https://yarnpkg.com/) and [npm](https://www.npmjs.com/get-npm) works like this:

1. Fetch package version metadata and tags from the registry.

1. If the "latest" tag exists, check if the specified range is satisfied using the "latest" version; if so, resolve that and do not look any
   further.

1. If not, resolve the maximum version that satisfies the range, regardless of tag.

This is difficult to find documented, but you can [read the code](https://github.com/yarnpkg/yarn/blob/a4708b29ac74df97bac45365cba4f1d62537ceb7/src/resolvers/registries/npm-resolver.js#L51).

If that is the case, how would we ever arrange to resolve a different version than "latest"?  Suppose we would like to use 1.0.1@alpha, because it
contains a fix that we need, how can we get it?  How about asking for ^1.0.1?

<div id="example-tag-B"></div>

It worked &ndash; we didn't resolve 1.0.0@latest &ndash; but it may have worked a bit better than expected.  It did not select 1.0.1@alpha,
it resolved 1.0.2@beta.

Perhaps this would be OK in many cases, after all 1.0.2 is later than 1.0.1, but if we really wanted to use the "alpha" version, what about
trying again, this time explicitly specifying the "alpha" tag:

<div id="example-tag-C"></div>

Excellent!  That is exactly what we asked for, but it is important to note there will be no sign of the "alpha" tag in
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

Suppose `package.json` specifies ^1.0.1 which resolves to 1.0.2@beta.  What if the
package publisher is determines that 1.0.1 is stable and so decides to give it the "latest" tag?

```
# Add the "latest" tag to version 1.0.1.
> npm dist-tag add '@bozemanpass/example@1.0.1' latest

> yarn install --no-lockfile
> cat node_modules/@bozemanpass/example/package.json | jq .version
"1.0.1"
```
> A different package is used for this one widget, since before/after states need to be demonstrated.

<div id="example-tag-D"></div>

The resolved version moved backwards!  Given the package resolution rules detailed above it does make sense:

Before 1.0.1 was tagged "latest", the range could not be satisfied by the "latest" version, and so all
versions, regardless of tags were considered, with the highest one resolved. But after tagging, the range
was satisfied by the "latest" version, and so other versions were not considered.

The manner in which tags affect version resolution, especially the implicit "latest" tag, is one of the least
documented aspects of [yarn](https://yarnpkg.com/) and [npm](https://www.npmjs.com/get-npm), but as the examples show, one with significant practical consequences.

### Pre-release Versions - x.y.z-a.b

The SemVer spec also allows for a "pre-release version" that can be indicated by adding an hyphen after the _patch_
portion, followed by "dot separated identifiers".  There are many forms this can take, but a common one is something like:
1.3.9-beta.4.

> This "pre-release" portion is sometimes also called a "preid".

Pre-release strings can be used in ranges: generally, pre-release versions don't satisfy a range unless specifically requested. Given the following versions:

```
1.3.8
1.3.9-alpha.1
1.3.9-beta.4
1.3.9-rc.0
1.3.10-alpha.0
```

The range ^1.3.8 would not match any of the 1.3.9-_xyz_ pre-releases.  But which version would you
expect ^1.3.9-alpha.1 to match?  Better yet, why?

<div id="example-PR-A"></div>

A range that includes a pre-release version is resolved by looking for:

1. Higher versions in the whole compatible range that are _without_ a pre-release string (e.g. 1.3.10).
2. The highest _lexical_ pre-release string with the same _MAJOR.Minor.patch_.

So in this case, 1.3.9-alpha.1 will resolve to 1.3.9-rc.0, but not because "rc" stands for "release candidate",
or because it was published later, but simply because "r" comes after "a" in the alphabet.

1.3.10-alpha.0 will not be selected because it does not have the same _MAJOR.Minor.patch_ value.

However, if 1.3.10 is published down the road, ^1.3.9-alpha.1 would select 1.3.10, since a regular version
always has higher precedence than a pre-release version.


> Although sometimes the string of characters used as a pre-release label is the same string of characters used for a registry tag (e.g. version:1.3.9-alpha.1 and tag:alpha), 
>if this happens it's a coincidence or quirk of the brains of the humans responsible for assigning versions and tags &ndash; none of the software interpreting versions and tags is 
>aware and the two things are procesed processed separately and independently. Consider not using the same string for a more orthogonal life experience.

For the package publisher there is another important quirk of pre-releases.  Since the pre-release
portion is "baked" into each version, it is a stumbling block for "promoting" releases.
For example, if after sufficient testing we wanted to promote 1.3.9-rc.0 to be the new, default release we
could not simply tag it "latest", since it would still have "-rc.0" in its version.  Instead we would be forced to
republish a new version with a corrected version number.

## Recap

Among other things, we showed above that:

* `^` range has special behavior for zero. For a simple life experience: don't use zero.

* [yarn](https://yarnpkg.com/) and [npm](https://www.npmjs.com/get-npm) prefer to resolve a package tagged "latest", even if you never asked for that.

* Tags don't make it into package.json. This can lead to unexpected behavior with tagged versions.

* `^` range has special behavior when a preid is specified.

* Versions with a pre-release portion should never be tagged "latest": publish a new version instead.

* The pre-release string "alpha" has absolutely nothing to do with a tag "alpha", except perhaps in the mind of a human.


## yarn.lock

You might be wondering "doesn't yarn.lock solve these kinds of version resolution surprises?". The short answer is "not really" because
yarn.lock (and its npm sibling package-lock.json) are never included in a published package. These files only exist in a source code 
environment (where yarn install would be run) and only affect resolution of "first level" dependencies of that source code project.
In reality yarn.lock can make things more confusing not less, and leads to having multiple different versions of the same package.
For a longer answer see [this article](https://gajus.medium.com/stop-using-package-lock-json-or-yarn-lock-909035e94328).

## Command Line Yarnball

The core tools [yarn](https://yarnpkg.com/) and [npm](https://www.npmjs.com/get-npm) offer a lot of functionality, but they are also quite cumbersome for answering
some straightforward questions like, "What version would I get if I typed _this_?"

Web-based tools such as [npm semver calculator](https://semver.npmjs.com/) are more straightforward, but less capable and
more difficult to incorporate into a development workflow.  They can also yield occasionally results which are 
baffling even when correct (e.g. try with the `@bozemanpass/example` package, and attempt to determine from the
information presented why 1.0.2 was not resolved).

In the code supporting this article, we have included CLI utilities that aim to be both simple and capable, using
same package resolution code as [yarn](https://yarnpkg.com/), but in a lightweight, standalone form.

* `yarnball` Resolves a single package name/version.
* `yarnball-deep` Resolves a package and all its dependencies, presented as a tree.
* `yarnball-list` Resolves a package and all its dependencies, presented as a list.
* `yarnball-multiples` Similar to `yarnball-list`, but only displays dependencies with multiple versions.

Unlike `yarn why`, these tools are stateless (don't create files) and can be executed outside of any existing project.

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

But even better is to try for yourself right here in the browser:

<div id="example-con-A"></div>

> &copy; 2021 Bozeman Pass, Inc.
> All Rights Reserved.
