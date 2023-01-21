# minecraft-updater-script

This is just a collection of scripts to deploy a minecraft server on Linux. The default configuration expects at least 8 gb of ram available.

# How to setup

On a the server where you'd like to install MC

```bash
git clone git@github.com:austinkregel/minecraft-updater-script
cd minecraft-updater-script
rm -r .git
# As root, run the update script.
# For vanilla 
bash update-script.sh vanilla
 # or for PaperMC
 bash update-script.sh paper
 ```

# What will happen when I do that?

In the directory the script is running from the script is expected to do the following:

 - Create the following folders `versions`, `minecraft`, `minecraf/logs`, `minecraft/config`, and `minecraft/plugins`
 - Automatically accept the [Minecraft ELUA, please read it before running the script](https://www.minecraft.net/en-us/eula)
 - Create a `supervisord` config file at `/etc/superivosr/conf.d/minecraft.conf`
 - Fetch the latest build list from Minecraft's servers
 - Download the latest build of the given minecraft server type
 
That's it.

# Does it come with an admin interface?

No not at the moment. I don't play on my server enough to need to know the details or even need remote access.

## How do I configure this?

Before running the update-script.sh, edit the `minecraft.conf` file.

After running the script, the file will be located at `/etc/supervisor/conf.d/minecraft.conf`

