# Node-RED Alexa Voice Service

This node will allow you to interact with the Alexa Voice Service (the same API that powers Echo devices) You send in a short audio clip and get an audio response. This audio can come from alsmost any source either the microphone, reading a local file or be generated using a separate Text to Speech Node.


## Amazon oAuth
The examples folder contains flows for obtaining an Access Token via oAuth which you need to pass to the AVS node. In order to use oAuth you need to obtain a set of credentials from Amazon. Make a note of these credentials as you will need to put them into the auth flow nodes. Make sure to record your Product ID, Client ID, and Client Secret.

- Login at [https://developer.amazon.com](https://developer.amazon.com) and go to `Alexa` then `Your Alexa Consoles` (top right) then `Products`.
- Click `Create Product`. 
- You are at `Product Information` page.
    - For the `Product ID` and `Product name` use something like _alexaweb_ or whatever you want.
    - For `Product Type` select `Alexa-Enabled Device`
    - For `Category` and `Description` enter whatever you want
    - All other fields can be filled out how you plan to use your AlexaPi
    - `Next`
- You are at `Security Profile` page.
    - Click `Create New Profile`. 
    - Choose whatever for `Security Profile Name` and `Security Profile Description`. Hit `Next`.
    - Under `Web`: (assuming you are running Node-RED on localhost port 1880)
        - `Allowed Origins` - put there `http://localhost:1880`, 
        - `Allowed Return URLs` put `http://localhost:1880/code`, 
- You should now be at the devices page
- Click `Update`.