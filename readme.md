This repo has code for a basic Finite State Machine (FSM) implemetiation focused around misty's speak command as well as an outline of steps to reacreate
The code sample also has a basic but buggy implementation of using an external controller over serial to drive misty (in this case a PS4 controller connected to a ESP32 in misty's backpack)

## Steps for creating a Fininite State Machine using Misty's builtin js
I am in somewhat of a disbelief that this is as hard as it is, so if this is incorrect or there is an easier way to do this, please LMK
**core issue: there is no way to pass state in and out of callback functions**
Solution: use the misty key-value database

Basic Outline:
1. Create a callback function that the main thread should wait to complete
2. In the completed callback function, change a database key
3. Once the callback is created, hang the main thread on checking the DB until it's value is changed by the callback
4. Once the callback is completed, check the database for a value passed from the callback 

Based around the above steps, it is simple to create a FSM around this

**Note:** At first glance it seems the DB is redundant as a global variable can be used, however callbacks don't seem to get the correct global scope and no amount of dredging through odd objects seems to be able to pass a state, besdies the DB

Outline but with code samples:
1. `misty.Speak(speechString, 0, 0, null, false, id);` Note: id needs to be random number of somesort. If it isn't passed, speech callback isn't called.
2. `function _tts_play_complete_message(data){ ... misty.Set('SpeechCallback', 'Done'); ...` SpeechCallback is the key used here as an example, it can be anything
3. `while(!misty.get('SpeechCallback')){}` Nothing else will happend on the main thread now
4. `misty.get('SpeechCallbackValue')` Example used to get result state or other callback value
