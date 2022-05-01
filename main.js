var testJson = {
    initial: [
        'This is a test',
        'This is a second test'
    ],
    quiz: [
        ['This is a sample question', 
        'This is what should be said when it is correct', 
        'This is something that should be said when it is incorrect'],
        ['Another sample quesiton', 'Correct', "incorrect"]
    ],
    closing: [
        'That is just about it. Goodbye!',
        'This should also get said before ending'
    ]
};



misty.Debug('starting');
var speechMap = new Map(); 
var serialWaitCallbacks = []; 
misty.Debug("speechMap: " + JSON.stringify(speechMap.keys()));
misty.AddReturnProperty("SerialMessage", "SerialMessage");
misty.RegisterEvent("SerialMessage", "SerialMessage", 0, true);
misty.RegisterEvent("tts_play_complete_message", "TextToSpeechComplete", 0, true);
misty.SetLogLevel("Debug", "Debug");
misty.MoveHead(0, 0, 0, 100, null);
misty.Set('HeadPosition', JSON.stringify([0, 0, 0]));
misty.SetTextDisplaySettings(null, null, false, true, 1, 25, 400, true, 'Center', 'Bottom');


function _tts_play_complete_message(data){
    if(data['Error']){
        misty.Debug('Utterance has error')
    } else{
        misty.Debug('Speech Done: '+data['UtteranceId']);
        misty.Set('SpeechCallback', 'Done');
    }
}


function _SerialMessage(data) {
    try{
        var recievedString = data.AdditionalResults[0].Message;
        misty.DisplayText('\n\n\n'+recievedString);
        misty.Debug("Serial Recieved: "+ recievedString);
        if(misty.Get('SerialCallback') == 'waiting'){
            misty.Set('SerialCallback', recievedString);
        }
        var controllerObj = JSON.parse(recievedString);
        misty.Debug('Controller Stick Position' + controllerObj.LStick[1] + controllerObj.LStick[0])
        if(Math.max(...controllerObj.LStick) > 8 || Math.min(...controllerObj.LStick) < -8){
            misty.Drive(controllerObj.LStick[1]*0.769230769, controllerObj.LStick[0]*-0.769230769*.5);
        } else{
            misty.Drive(0, 0);
        }
        var headPosition = [0, 0, 0]
        if(Math.max(...controllerObj.RStick) > 16 || Math.min(...controllerObj.RStick) < -16){
            headPosition += [controllerObj.RStick[1]*-0.3125, controllerObj.RStick[0]*0.3125, 0];
        }
        if(controllerObj.L2 > 2  || controllerObj.R2 > 2){
            headPosition[3] = (controllerObj.R2 - controllerObj.L2)*0.317647059;
        }
        misty.MoveHead(...headPosition, 100);
    }
    catch(exception) {
        misty.Debug("Exception " +exception);
    }
}

function speechHold(){
    misty.Debug('starting Hold on speech');
    while(true){
        var speechString = misty.Get('SpeechCallback');
        misty.Debug("SpeechString is "+ speechString);
        misty.Pause(10);
        if(speechString){
            misty.Remove('SpeechCallback');
            misty.Debug('success');
            break;
        }
    }
}

function serialHold(){
    misty.Set('SerialCallback', 'waiting');
    while(true){
        var controllerString = misty.Get('SerialCallback');
        if(controllerString != 'waiting'){
            misty.Remove('SerialCallback');
            var object = JSON.parse(controllerString);
            if(object.Square){
                var value = 0;
            }
            else if(object.Cross){
                var value = 1;
            }
            /*else if (object.Circle){
                var value = 2;
            }
            else if(object.Triangle){
                var value = 3;
            }*/
            return value;
            

        }
}
}


async function loopAsync(array, callbackFn)  {
    misty.Debug('Starting async loop' + array.length);
    for(var i = 0; i < array.length; i++){
        misty.Debug('Calling '+ array[i]);
        await callbackFn(array[i]);
        misty.Debug('done with '+ array[i]);
    }
}


function speakAsync(speechString){
    misty.Debug('Saying: '+speechString);
    var id =  (Math.random() + 1).toString(36).substring(2);
    misty.Debug('Speech Id: ' + id);
    misty.Speak(speechString, 0, 0, null, false, id);
    speechHold();
}


async function serialMessageBlockAndSpeak(speechStrings){
    misty.Debug('Quiz ' + speechStrings);
    var soundsToPlay = ['correct.mp3', 'incorrect.mp3'];
    var soundsLength = [2500, 2000];
    speakAsync(speechStrings[0]);
    var value = serialHold();
    misty.PlayAudio(soundsToPlay[value], 80, 0, soundsLength[value]);
    speakAsync(speechStrings[value+1]);
}

async function sayJson(json){
    misty.Debug('sayJson Called');
    for(var i = 0; i < json.initial.length; i++){
        misty.Debug('starting with string '+i);
        speakAsync(json.initial[i]);
        misty.Debug('done with string '+i);
    }
    for(var i = 0; i < json.quiz.length; i++){
        misty.Debug('starting with string '+i);
        serialMessageBlockAndSpeak(json.quiz[i]);
        misty.Debug('done with string '+i);
    }
    for(var i = 0; i < json.initial.length; i++){
        misty.Debug('starting with string '+i);
        speakAsync(json.closing[i]);
        misty.Debug('done with string '+i);
    }
};

function initialHold(){
    misty.Set('SerialCallback', 'waiting');
    while(true){
        var controllerString = misty.Get('SerialCallback');
        if(controllerString != 'waiting'){
            misty.Remove('SerialCallback');
            var object = JSON.parse(controllerString);
            if(object.Down){
                sayJson(testJson);
                return;
            }
            

        }
}
}
while(true){
    initialHold();
}