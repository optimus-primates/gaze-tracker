"use strict";

const height = 480;
const width = 640;
const cameraPosX = width / 2;
const cameraPosY = -60;

window.onload = bootstrapGazer();

function bootstrapGazer() {

    var frameCount = 0;
    var cGaze = new camgaze.Camgaze(
        width,
        height,
        "mainCanvas"
    );
    var eyeTracker = new camgaze.EyeTracker(width, height);
    var eyeFilter = new camgaze.EyeFilter();
    var drawer = new camgaze.drawing.ImageDrawer();
    var gazeObj = new Object();
    initializeGazeStats(gazeObj);

    cGaze.setFrameOperator(function(image_data, video) {

        var trackingData = eyeTracker.track(image_data, video);
        var gazeList = eyeFilter.getFilteredGaze(trackingData);
        var nEyes = trackingData.eyeList.length;

        if (nEyes > 1) {

            var leftEye = gazeList[0];
            var rightEye = gazeList[1];
            //console.log(rightEye);
            if (leftEye === undefined || rightEye === undefined)
                return;

            if (leftEye.centroid.unfiltered.x > rightEye.centroid.unfiltered.x) {
                var tmp = leftEye;
                leftEye = rightEye;
                rightEye = leftEye;
            }

            gazeObj.leftPos.x.push(leftEye.centroid.unfiltered.x);
            gazeObj.leftPos.y.push(leftEye.centroid.unfiltered.y);
            gazeObj.rightPos.x.push(rightEye.centroid.unfiltered.x);
            gazeObj.rightPos.y.push(rightEye.centroid.unfiltered.y);
            gazeObj.leftGaze.x.push(leftEye.gazeVector.x);
            gazeObj.leftGaze.y.push(leftEye.gazeVector.y);
            gazeObj.rightGaze.x.push(rightEye.gazeVector.x);
            gazeObj.rightGaze.y.push(rightEye.gazeVector.y);
            gazeObj.distance.push((rightEye.eyeData.pupil.contourArea + leftEye.eyeData.pupil.contourArea) /Math.pow(Math.PI,2));
            frameCount++;
        }

        gazeList.forEach(
            function(eye) {
                //console.log(eye);
                //console.log(eye.eyeData.getHaarRectangle());

                image_data = drawer.drawRectangle(
                    image_data,
                    eye.eyeData.getHaarRectangle(),
                    eye.eyeData.getHaarRectangle().width,
                    eye.eyeData.getHaarRectangle().height,
                    5,
                    "blue"
                );

                // draws the gaze
                image_data = drawer.drawLine(
                    image_data,
                    eye.centroid.unfiltered,
                    eye.centroid.unfiltered.add(eye.gazeVector),
                    5,
                    "green"
                );

                // draws the pupil
                image_data = drawer.drawCircle(
                    image_data,
                    eye.centroid.unfiltered,
                    5, // radius
                    -1, // line width (filled)
                    "red"
                );
            }
        );


        //Every 2 seconds
        if (frameCount % 20 == 0 && gazeObj.leftPos.x.length > 0 && isGazeOnScreen(gazeObj)) {
            document.getElementById("audio").play();
            resetGazeStats(gazeObj);
        }


        return image_data;
    });
}


function isGazeOnScreen(gazeObj) {
    "use strict";

    //console.log(gazeObj);

    var leftPosX = getAverageNormalized(gazeObj.leftPos.x,0);
    var leftPosY = getAverageNormalized(gazeObj.leftPos.y, -60);
    var rightPosX = getAverageNormalized(gazeObj.rightPos.x, 0);
    var rightPosY = getAverageNormalized(gazeObj.rightPos.y, -60);
    var distance = getAverage(gazeObj.distance)*50;
    var leftGazeX = getAverage(gazeObj.leftGaze.x);
    var leftGazeY = getAverage(gazeObj.leftGaze.y);
    var rightGazeX = getAverage(gazeObj.rightGaze.x);
    var rightGazeY = getAverage(gazeObj.rightGaze.y);

    //console.log(leftPosX);

    return isEyeLookingAtScreen(leftPosX, leftPosY, leftGazeX, leftGazeY, distance)
        || isEyeLookingAtScreen(rightPosX, rightGazeY, rightGazeX, rightGazeY, distance);

}

function initializeGazeStats(gazeObj) {
    gazeObj.leftPos = new Object();
    gazeObj.leftPos.x = [];
    gazeObj.leftPos.y = [];
    gazeObj.rightPos = new Object();
    gazeObj.rightPos.x = [];
    gazeObj.rightPos.y = [];
    gazeObj.leftGaze = new Object();
    gazeObj.leftGaze.x = [];
    gazeObj.leftGaze.y = [];
    gazeObj.rightGaze = new Object();
    gazeObj.rightGaze.x = [];
    gazeObj.rightGaze.y = [];
    gazeObj.distance = [];
}

function resetGazeStats(gazeObj) {
    gazeObj.leftPos.x = [];
    gazeObj.leftPos.y = [];
    gazeObj.rightPos.x = [];
    gazeObj.rightPos.y = [];
    gazeObj.leftGaze.x = [];
    gazeObj.leftGaze.y = [];
    gazeObj.rightGaze.x = [];
    gazeObj.rightGaze.y = [];
    gazeObj.distance = [];
}


function getAverage(array) {
    var res = 0;
    for (var i = 0; i < array.length; ++i){
        res += parseInt(array[i]);
    }
    return res / (array.length+1);
}

function getAverageNormalized(array, normalizeFactor) {
    var res = 0;
    for (var i = 0; i < array.length; ++i){
        res += /*Math.abs*/(array[i] - normalizeFactor);
    }
    return res / (array.length+1);
}


function isEyeLookingAtScreen(posX, posY, gazeX, gazeY, distanceFromWebCam){
    var c1 = Math.sqrt(Math.pow(posX,2)+Math.pow(distanceFromWebCam,2));
    var c2 = (width - posX);
    var maximumIpotenusaX = Math.sqrt(Math.pow(c2, 2)+Math.pow(c1,2));
    var maximumAngleX = Math.asin(c2/maximumIpotenusaX)*12*Math.PI;

    
    c2 = (height - posY);
    var maximumIpotenusaY = Math.sqrt(Math.pow(c2, 2)+Math.pow(c1,2));
    var maximumAngleY = Math.asin(c2/maximumIpotenusaY)*12*Math.PI;

    return gazeX < maximumAngleX && gazeY < maximumAngleY;
}



/*
    y = distance + gazeX

*/

