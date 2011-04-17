
// The Audio player
var my_media = null;
var mediaTimer = null;
// duration of media (song)
var dur = -1;
// need to know when paused or not
var is_paused = false;

var lastFlipVal = "off";

//Set audio position on page
function setAudioPosition(position) {
    $("#audio_position").html(position + " sec");
}

//onSuccess Callback
function onSuccess() {
    setAudioPosition(dur);
    clearInterval(mediaTimer);
    mediaTimer = null;
    my_media = null;
    is_paused = false;
    dur = -1;
}

//onError Callback 
function onError(error) {
    alert('code: '    + error.code    + '\n' + 
            'message: ' + error.message + '\n');
    clearInterval(mediaTimer);
    mediaTimer = null;
    my_media = null;
    is_paused = false;
    setAudioPosition("0");
}

function playAudio(src) { 
	$('#pauseaudio').show();
	$('#stopaudio').show();
    if (my_media === null) {
        // ui niceties
        $("#media_dur").html("0");
        $("#audio_position").html("Loading...");
        
        // Create Media object from src
        my_media = new Media(src, onSuccess, onError);       
        // Play audio
        //alert('Playing Audio');
        my_media.play();
    } else {
        if (is_paused) {
            // to resume where paused in song: call .play()
            is_paused = false;
            my_media.play();
        }
    }

    // Update my_media position every second
    if (mediaTimer === null) {
        mediaTimer = setInterval(function() {
            my_media.getCurrentPosition(
                    // success callback
                    function(position) {
                        if (position > -1) {
                            setAudioPosition(Math.round(position/1000));
                            // getDuration() can take a few seconds so keep trying
                            // this could be done a better way, no callback for it
                            if (dur <= 0) {
                                dur = my_media.getDuration();                             
                                if (dur > 0) {
                                    dur = Math.round(dur/1000);
                                    $("#media_dur").html(dur);
                                }
                            }                                                      
                        }
                    },
                    // error callback
                    function(e) {
                        alert("Error getting pos=" + e);
                        setAudioPosition("Error: " + e);
                    }
            );
        }, 1000);
    }
}
 
//Pause audio
function pauseAudio() {
    if (my_media) {
        is_paused = true;
        my_media.pause();
        $('#pauseaudio').hide();
    } 
}

//Stop audio
function stopAudio() {
	$('#pauseaudio').hide();
	$('#stopaudio').hide();
    if (my_media) {
        // A successful .stop() will call .release()
        my_media.stop();
        my_media = null;
    }
    if (mediaTimer) {
        clearInterval(mediaTimer);
        mediaTimer = null;
    }
    is_paused = false;
    setAudioPosition("0");
    $("#media_dur").html("0");
    dur = 0;
}

// Start of Flip implementation
var accelWatch = null;
var options = { 'frequency' : 1900 };
var lastZ = null;

function updateAcceleration(a) {    
    var changeThreshhold = 12;
    
    if (lastZ !== null) {  // not first time
        var deltaZ = Math.abs(lastZ - a.z);
        if (deltaZ > changeThreshhold) { 
            if (lastZ > 0) { $("#playaudio").trigger('tap'); }
            else { pauseAudio(); }          
            lastZ = null;          
            return;
            } 
    }
    lastZ = a.z;
}

var setFlipper = function(state) {
    if (state === "off") {
        if (accelWatch) {
            navigator.accelerometer.clearWatch(accelWatch);
            accelWatch = null;
        }
    } else {
        accelWatch = navigator.accelerometer.watchAcceleration(
                updateAcceleration, 
                function(ex) {
                    alert("accel fail (" + ex.name + ": " + ex.message + ")");
                }, 
                options);
    }    
};

$(document).ready(function() {

    $("#playaudio").live('tap', function() {
        // Note: two ways to access media file: web and local file        
        //var src = 'http://audio.ibeat.org/content/p1rj1s/p1rj1s_-_rockGuitar.mp3';
        
        // local (on device): copy file to project's /assets folder:
        //var src = '/android_asset/spittinggames.m4a';
        var src = '/android_asset/music/kill-bill-silbido.mp3';
        
        playAudio(src);
    });

    $("#pauseaudio").live('tap', function() {
        pauseAudio();
    });
    
    $("#stopaudio").live('tap', function() {
        stopAudio();
    });
    
    // Start with the controls hide
    $('#pauseaudio').hide();
    $('#stopaudio').hide();
    
    // Start with Manual selected and Flip Mode hidden
    $('#nav-manual').focus();
    $('#content-flip').hide();
    
    $('#nav-manual').live('tap', function() {
        // if flip is ON, don't change pages
        if (lastFlipVal === "on") {
            alert("Set Flip Control OFF to switch to manual control.");
            return;
        }
        $('#content-flip').hide();
        $('#content-manual').show();
        stopAudio();
    });
    
    $('#nav-flip').live('tap', function() {
        $('#content-manual').hide();
        $('#content-flip').show();
        stopAudio();
    });
 
    $('#pauseslider').change(function() {
        if (lastFlipVal !== $(this).val()) {
            var newFlipVal = $(this).val();
            if (newFlipVal === "off") {                
                stopAudio();
            }
            lastFlipVal = newFlipVal;
            setFlipper(newFlipVal);        
        } // else a false alarm, no change in on/off
    });
    
});
