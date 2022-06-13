import './style.css';
// import the pose detection functionality from the pose module
import PoseDetector from './pose.js';

// variables to record video, display video, and display points
const video = document.getElementById('input-video');
const canvas = document.getElementById('output-canvas');
const canvasCtx = canvas.getContext('2d');

// an array of pose points with their score and names
let posePoints = null;
// where the video frame data goes
let camera_stream = null;
// the object that records the video
let mediaRecorder;

const FRAMERATE = 50; // frames per second
// confidence required to display a point
const CONFIDENCE_THRESHHOLDS = {
  'MoveNet': 0.4,
  'PoseNet': 0.5,
  'BlazePose': 0.8
}

// pose model
const poseModel = new PoseDetector();
let model;

// update the points after receiving a result from the pose module
function updatePose(result) {
  posePoints = result[0] ? result[0]['keypoints'] : [];
}

// draw the pose points on the canvas
function drawPose() {
  if (posePoints) {
    for (let i in posePoints) {
      let point = posePoints[i];
      if (point['score'] > CONFIDENCE_THRESHHOLDS[model]) {
        // circle
        canvasCtx.fillStyle = 'rgb(255, 0, 0)';
        canvasCtx.beginPath();
        canvasCtx.ellipse(point['x'], point['y'], 5, 5, 0, 0, 2*Math.PI);
        canvasCtx.fill();
        // label
        canvasCtx.font = '14px serif';
        canvasCtx.fillStyle = 'rgb(0, 255, 0)';
        canvasCtx.fillText(point['name'], point['x'] + 10, point['y'] + 10);
      }
    }
  }
}

// draw the current video frame
function drawVideo() {
  canvasCtx.drawImage(video, 0, 0);
}

// white out the canvas each frame to prevent visual artifacts
function clearCanvas() {
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
}

// send current frame to pose module & update pose, clear the canvas, & draw stuff
// (called every time 'dataavailable' fires, which is FRAMERATE times per second)
function processFrame(_) {
  poseModel.detectPose(video).then(updatePose);
  clearCanvas();
  drawVideo();
  drawPose();
}

function setupCamera() {
  // this is a builtin JS method to get user media like webcam video
  navigator.mediaDevices.getUserMedia({ 
    video: true,
    audio: false
  }).then((result) => {
    let videoWidth = result.getVideoTracks()[0].getSettings().width;
    let videoHeight = result.getVideoTracks()[0].getSettings().height;

    // set the video element's width & height to camera output's width & height
    // (this is necessary because some models need the width & height set explicitly)
    camera_stream = result;
    video.srcObject = camera_stream;
    video.width = videoWidth;
    video.height = videoHeight;
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    mediaRecorder = new MediaRecorder(camera_stream, { mimeType: 'video/webm' });
    
    poseModel.createDetector(model).then(() => {
      mediaRecorder.addEventListener("dataavailable", processFrame);
    });
    // this takes in the milliseconds per frame, aka how often the above event fires
    mediaRecorder.start(1000 / FRAMERATE);
  });
}

// setup camera when start button clicked
document.getElementById('start').onclick = () => {
  // set model to dropdown value and start camera
  model = document.getElementById('model').value;
  setupCamera();

  // remove start button, lock dropdown
  document.getElementById('start').style = 'display: none;';
  document.getElementById('model').setAttribute('disabled', 'disabled');
};