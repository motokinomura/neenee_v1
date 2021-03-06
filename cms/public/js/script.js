
$(function(){

    let localStream = null;
    let peer = null;
    let existingCall = null;
    let audioSelect = $('#audioSource');
    let videoSelect = $('#videoSource');

    navigator.mediaDevices.enumerateDevices()
        .then(function(deviceInfos) {
            for (let i = 0; i !== deviceInfos.length; ++i) {
                let deviceInfo = deviceInfos[i];
                let option = $('<option>');
                option.val(deviceInfo.deviceId);
                if (deviceInfo.kind === 'audioinput') {
                    option.text(deviceInfo.label);
                    audioSelect.append(option);
                } else if (deviceInfo.kind === 'videoinput') {
                    option.text(deviceInfo.label);
                    videoSelect.append(option);
                }
            }
            videoSelect.on('change', setupGetUserMedia);
            audioSelect.on('change', setupGetUserMedia);
            setupGetUserMedia();
        }).catch(function (error) {
            console.error('mediaDevices.enumerateDevices() error:', error);
            return;
        });

    peer = new Peer({
        key: 'dda46086-ab68-4901-9f0b-3c852590078c',
        debug: 3
    });

    peer.on('open', function(){
        $('#my-id').text(peer.id);
    });

    peer.on('error', function(err){
        alert(err.message);
    });

    $('#make-call').submit(function(e){
        e.preventDefault();
        let roomName = $('#join-room').val();
        if (!roomName) {
            return;
        }
        // const call = peer.joinRoom(roomName, {mode: 'sfu', stream: localStream});
        const call = peer.joinRoom(roomName, {mode: 'mesh', videoCodec: 'H264', stream: localStream});
        setupCallEventHandlers(call);
    });

    $('#end-call').click(function(){
        existingCall.close();
    });

    function setupGetUserMedia() {
        let audioSource = $('#audioSource').val();
        let videoSource = $('#videoSource').val();
        let constraints = {
            // audio: {deviceId: {exact: audioSource}},
            audio: true,
            video: {
                width: { min: 320, max: 1280 },
                height: { min: 240, max: 720  }
            }

            // video: {deviceId: {exact: videoSource}}
            // video: {facingMode: 'user'}
        };
        // constraints.video.width = {
        //     min: 300,
        //     max: 300
        // };
        
        // constraints.video.height = {
        //     min: 300,
        //     max: 300        
        // };

        if(localStream){
            localStream = null;
        }

        navigator.mediaDevices.getUserMedia(constraints)
            .then(function (stream) {
                $('#myStream').get(0).srcObject = stream;
                localStream = stream;

                if(existingCall){
                    existingCall.replaceStream(stream);
                }

            }).catch(function (error) {
                console.error('mediaDevice.getUserMedia() error:', error);
                return;
            });
    }

    function setupCallEventHandlers(call){
        if (existingCall) {
            existingCall.close();
        };

        existingCall = call;
        setupEndCallUI();
        $('#room-id').text(call.name);

        call.on('stream', function(stream){
            addVideo(stream);
        });

        call.on('removeStream', function(stream){
            removeVideo(stream.peerId);
        });

        call.on('peerLeave', function(peerId){
            removeVideo(peerId);
        });

        call.on('close', function(){
            removeAllRemoteVideos();
            setupMakeCallUI();
            // テスト：リダイレクトできるようになったけどUI的にやっぱやめるかも？
            location.href = $("#item_url").val();
        });
    }

    function addVideo(stream){
        const videoDom = $('<video autoplay playsinline="true">');
        videoDom.attr('id',stream.peerId);
        videoDom.attr("css", { width: "300px" });
        videoDom.css({"width":"100%","height":"auto"});
        videoDom.get(0).srcObject = stream;
        videoDom[0].width = 300;
        videoDom[0].height = 200;
        $("#myStream").css({"width":"100px","position":"absolute","right":"2px","bottom":"2px","border":"solid 3px #fff"});
        $('.videosContainer').append(videoDom);
    }

    function removeVideo(peerId){
        $('#'+peerId).remove();
    }

    function removeAllRemoteVideos(){
        $('.videosContainer').empty();
    }

    function setupMakeCallUI(){
        $('#make-call').show();
        $('#end-call').hide();
    }

    function setupEndCallUI() {
        $('#make-call').hide();
        $('#end-call').show();
    }

});