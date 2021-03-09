# Example Typescript 4.x Library

Simple starter library updated in 2021.

Tutorial can be found at
[https://www.tsmean.com/articles/how-to-write-a-typescript-library/](https://www.tsmean.com/articles/how-to-write-a-typescript-library/).

# Usage

First you should get the repo
```
git clone https://github.com/bersling/typescript-library-starter.git
```

Then you can apply any changes you'd like to the `library-starter`.

## Give it a name

Adjust the `name` in `library-starter/package.json`. Check with `npm` to see which names are still free.

You can also adjust the version back to `1.0.0` or `0.0.1`.

## Testing your module locally with npm link

Using [npm link](https://www.tsmean.com/articles/how-to-write-a-typescript-library/local-consumer) you can easily test whether your changes are working correctly.

```
cd example-consumer
npm run linklib
npm test
```

Here `npm run linklib` is just an alias for `npm run --prefix ../library-starter build && npm link ../library-starter`.

## Publishing a beta aka. "next" version

In order not to break things for the users of your library it is a best practice to first publish it with a `beta` or `next` tag. That way early adopters or yourself can test some more by using `npm install mylib@beta` and once you're ready you can publish the actual version `npm publish mylib`.

Change the `version` property in `library-starter/package.json` for example to `2.1.1-beta.1`.

```
cd library-starter
npm run publish-beta
```

Here `npm run publish-beta` is an alias for `npm run build && npm publish --tag beta`.

Then test it through

```
cd example-consumer
npm run install-beta
npm test
```

`npm run install-beta` is an alias for `npm install hwrld@beta`.

## Dry run of publish

It is also a good idea to do a dry run before you publish. That way you can check once more whether the version is correctly specified and you include the correct files.

```
cd library-starter
npm run publish-dryrun
```

`npm run publish-dryrun` is an alias for `npm run build && npm publish --dry-run`.

## Publish a new version

First adjust the `version` in `library-starter/package.json`.

Once you are ready to publish an actual version you can run

```
cd library-starter
npm run publish-lib
```

`npm run publish-lib` is an alias for `npm run build && npm publish`

You can consume it like this:
```
cd example-consumer
npm run install-lib
npm test
```

`npm run install-lib` is equal to `npm install hwrld` or `npm install hwrld@latest`.

# Further reading

You can write a test like this:
https://www.tsmean.com/articles/how-to-write-a-typescript-library/unit-testing
