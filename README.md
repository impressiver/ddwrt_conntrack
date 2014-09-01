DD-WRT Conntrack
================
# QoS IP Connection Tracking / Bandwidth Monitor

Derived from [qos_conntrack](https://csdprojects.co.uk/ddwrt/), with a few bug fixes and updated to work with 3.x kernel builds.


## Issues

- [ ] QoS labeling isn't working yet. The QoS `mark` values are masked in later builds of DD-WRT, and I'm still figuring out how to calculate QoS priority from them.


## How to use

From the terminal, SSH (or telnet) into your router and CD to a permanent storage directory (eg. jffs, usb).
Let's call that directory `$JFFS`.


### Download
You can also SCP the files from your computer if you prefer, but the easist way to get the 
```sh
export JFFS=/jffs # Replace with the appropriate path
cd $JFFS
wget http://github.com/impressiver/ddwrt_conntrack.zip
unzip ddwrt_conntrack.zip
```

### Bootstrap
The following is the startup script used to run `ddwrt_conntrack` automatically.
But first, try running these commands manually to make sure everything works:
```sh
chmod +x $JFFS/ddwrt_conntrack/MyPage/*.sh
cp -r $JFFS/ddwrt_conntrack/MyPage /tmp/
ln -s $JFFS/ddwrt_conntrack/MyPage/www/ddwrt_conntrack.js /tmp/www/
sleep 30 # Wait 30 sec before starting the monitor (only necessary at startup)
$JFFS/ddwrt_conntrack/MyPage/traffic_monitor.sh 10&
```
Now open a browser to the DD-WRT admin panel, and click 'Status', then 'MyPage'.
At this point, the traffic monitor should display active network clients, connections and bandwidth.


### Startup script  
In order for the traffic monitor to start automatically after reboot, you need to add the above as a startup script:  

1. Open the DD-WRT admin panel in your browser
2. Go to 'Commands' under 'Administration'
3. Paste the *bootstrap* script into the 'Command Shell' input
4. Click 'Save Startup'  

If saved successfully, the script will show up in the 'Startup' section of the 'Commands' page.


### Register MyPage
This will permanently set ddwrt_conntrack to load as 'MyPage' (under 'Status' in the admin panel).
Back in the terminal, run the following commands:
```sh
nvram set mypage_scripts="$JFFS/ddwrt_conntrack/MyPage/ddwrt_conntrack.sh"
nvram commit
```
