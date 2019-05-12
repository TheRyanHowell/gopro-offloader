# gopro-offloader

A project to make an automatic gopro footage offloader.

Flow:
```
  Attach Device
  Power on Offloader
    Automatic:
      Footage offloaded to network mount
      Send email with output log
      Poweroff offloader
  Detach device
```

## Setup
Clone this repo to the device.

Modify `run.sh` input/output directories and email settings.

Copy the systemd service file into `/etc/systemd/system/gopro-offloader.service`
Modify the service file to match your output directory/script location.

Copy the udev rule into `/etc/udev/rules.d/5-gopro.rules`, modify with your product id.
(found with `udevadm monitor --kernel --property --subsystem-match=usb`)

After udev is reloaded (or the device rebooted) `run.sh` will run automatically when the device
is attached (including on boot).

You can also run the script manually.

## Links
[GOGS](https://box.rhowell.io/gogs/ryan/gopro-offloader)

[GitHub Mirror](https://github.com/TheRyanHowell/gopro-offloader)
