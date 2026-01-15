#
# Moves patched brave's "resources.pak" to it's original location
#

export BRAVE_RESOURCES_PATH="/opt/brave-bin/brave_resources.pak"
export RESOURCES_FILENAME="$(basename $BRAVE_RESOURCES_PATH)"
export RESOURCES_BACKUP_FILENAME="$(basename $BRAVE_RESOURCES_PATH).bak"
export PATCHED_RESOURCES_PATH="patched.pak"

# Copy original resources if not exists in cwd
if [ ! -f "$RESOURCES_BACKUP_FILENAME" ]; then
    cp $BRAVE_RESOURCES_PATH $RESOURCES_BACKUP_FILENAME
    echo "Created backup: $RESOURCES_BACKUP_FILENAME"
fi

cp -f $RESOURCES_BACKUP_FILENAME $RESOURCES_FILENAME

bun run . --action=2 --arg=$RESOURCES_FILENAME --arg=$PATCHED_RESOURCES_PATH --arg=1
sudo mv $PATCHED_RESOURCES_PATH $BRAVE_RESOURCES_PATH

rm -f $RESOURCES_FILENAME

echo "Patched -> $BRAVE_RESOURCES_PATH"