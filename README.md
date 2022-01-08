# Node-RED Alexa Voice Service

This node will allow you to interact with the Alexa Voice Service (the same API that powers Echo devices) You send in a short audio clip and get an audio response. This audio can come from alsmost any source either the microphone, reading a local file or be generated using a separate Text to Speech Node.






# Authentication
First you need to obtain a set of credentials from Amazon to use the Alexa Voice service. Make a note of these credentials as you will need them  for the auth process. Make sure to record your Product ID,  Client ID, and Client Secret.

Login at https://developer.amazon.com and go to Alexa then Your Alexa Consoles (top right) then Products.
Click Create Product.
You are at Product Information page.
For the Product ID and Product name use something like AlexaPi or whatever you want.
For Product Type select Alexa-Enabled Device
For Category and Description enter whatever you want
All other fields can be filled out how you plan to use your AlexaPi
Next
You are at Security Profile page.
Click Create New Profile.
Choose whatever for Security Profile Name and Security Profile Description. Hit Next.
Under Web:
Allowed Origins - put there http://localhost:5050, https://localhost:5050, http://ALEXA.DEVICE.IP.ADDRESS:5050 and https://ALEXA.DEVICE.IP.ADDRESS:5050
Allowed Return URLs put http://localhost:5050/code, https://localhost:5050/code, http://ALEXA.DEVICE.IP.ADDRESS:5050/code and https://ALEXA.DEVICE.IP.ADDRESS:5050/code.
        You have to replace ALEXA.DEVICE.IP.ADDRESS with the IP (for example 192.168.1.123) of your AlexaPi device (for example Raspberry Pi). This is especially necessary when you are installing from another computer than AlexaPi is gonna run on.
You should now be at the devices page
Click Manage beside your new device
Click Capabilities and then enable:
Named Timers and Reminders
Display Cards
Display Cards with Text
Click Update.