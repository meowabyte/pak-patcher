# pak-patcher

> [!NOTE]
> This tool only supports .pak version 5. (Most recent by the time of writing this) Support for lower versions is not expected in near future unless requested.

Pak Patcher is an utility tool allowing you to easily manipulate `.pak` format files through CLI menu or using arguments. (when automating)

I created this tool since I wanted to edit style of Brave's New Tab page while also preserving it's [Brave Stats feature](https://brave.com/static-assets/images/optimized/blog/accurately-predicting-ad-blocker-savings/images/image1.png). (which wouldn't be possible through simple extension or would take too long when modifying source code.)

The tool preserves 99% of the same pak structure while packing as before extraction making it prone to breaking.

> [!CAUTION]
> Before modifying .pak files you stumble upon please take a solid note that careless modifying of .pak files in your apps might potentially **break your app and render it unusable**! Please do not edit or add IDs of any resource you extracted as the change most likely **won't get updated** in app! (editing it's content should be fine though)

## Features
- Extract .pak file
- Pack .pak file
- Patch resources in .pak file using JavaScript modules.

Pak Patcher also includes [example patch](/src/patches/new_tab.p.ts) module that modifies Brave's internal new tab page. It uses [plugin](/src/patches/new_tab/cssplugin.ts) made by me that under the hood replaces CSS imports into [LightningCSS](https://lightningcss.dev/) optimized style that later is added to new tab page.

## Requirements
- [Bun Runtime](https://bun.sh/)  
  The code will **NOT** work with basic Node.js runtime as the code specifically uses optimized APIs that are Bun exclusive.

...that's it.

## Preparation
```bash
# Install dependencies
$ bun install --frozen-lockfile

# Run the app
$ bun start
```
> [!NOTE]
> You can also use `bun debug` which will enable additional debug messages when doing operations with pak such as Metadata logging.

### CLI Usage
The tool uses fairly simple CLI structure where `--action=N` stands for action number from menu and each `--arg` stands for appropriate prompt that you can stumble upon in selected action.

Example from [included patch_newtab.sh script](/patch_newtab.sh) for Brave:
```bash
# Action=2 stands for Patch Action
# Arg=1 stands for Patch #1
$ bun run . --action=2 --arg=$RESOURCES_FILENAME --arg=$PATCHED_RESOURCES_PATH --arg=1
```

## Credits
- [Chromium data_pack.py source code](https://chromium.googlesource.com/chromium/src/tools/grit/+/master/grit/format/data_pack.py)

## Found a bug?
If you found a bug in a tool please report it to me on the [issues page](/issues).

# Preview

![Console with modified message](/assets/1.png)
![Modified source code](/assets/2.png)

# TODO:
- [ ] Full internal chrome typings for patching purposes. [(Current state)](/src/patches/new_tab/contents/typings.d.ts)
- [ ] Ability to preserve patches between updates (Chromium browsers)  
  Currently if there's an update that adds new resources, your patches will be discarded. Repatching fixes this.
- [ ] v4 support (V4 PAK NEEDED)
