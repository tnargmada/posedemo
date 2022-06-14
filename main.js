import './style.css';
// import the pose detection functionality from the pose module
import PoseDetector from './pose.js';

// variable to record video
const video = document.getElementById('input-video');

// an array of pose points with their score and names
let posePoints = null;
// where the video frame data goes
let camera_stream = null;
// the object that records the video
let mediaRecorder;

const FRAMERATE = 50; // frames per second
// confidence required to display a point
const CONFIDENCE_THRESHHOLDS = {
  'MoveNet': 0.3,
  'PoseNet': 0.5,
  'BlazePose': 0.7
}

// pose model
const poseModel = new PoseDetector();
let model;
let demo;

// update the points after receiving a result from the pose module
function updatePose(result) {
  posePoints = result[0] ? result[0]['keypoints'] : [];
  for (let point in posePoints) {
    posePoints[point]['x'] = video.width - posePoints[point]['x'];
  }
}

// draw the pose points on the canvas
function drawPose(p) {
  if (posePoints) {
    for (let i in posePoints) {
      let point = posePoints[i];
      if (point['score'] > CONFIDENCE_THRESHHOLDS[model]) {
        // circle
        p.stroke(50, 100, 100);
        p.fill(0, 100, 100);
        p.ellipse(point['x'], point['y'], 10, 10);
        // label
        let mouseDist = p.sqrt(p.pow(p.mouseX - point['x'], 2) + p.pow(p.mouseY - point['y'], 2));
        if (mouseDist < 15) {
          p.fill(50, 100, 100);
          p.text(point['name'], point['x'] + 10, point['y'] + 10);
        }
      }
    }
  }
}

// draw the current video frame
function drawVideo(p) {
  p.push();
  p.translate(p.width, 0);
  p.scale(-1, 1);
  p.drawingContext.drawImage(video, 0, 0);
  p.pop();
}

// send current frame to pose module & update pose, clear the canvas, & draw stuff
// (called every time 'dataavailable' fires, which is FRAMERATE times per second)
function processFrame(_) {
  poseModel.detectPose(video).then(updatePose);
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

    mediaRecorder = new MediaRecorder(camera_stream, { mimeType: 'video/webm' });
    
    poseModel.createDetector(model).then(() => {
      new p5(sketch);
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
  demo = document.getElementById('demo').value;
  setupCamera();

  // remove start button, lock dropdown
  document.getElementById('start').style = 'display: none;';
  document.getElementById('start-info').style = 'display: none;';
  document.getElementById('run-info').style = 'display: block;';
  if (demo == 'keypoints') {
    document.getElementById('keypoint-info').style = 'display: block;';
  } else {
    document.getElementById('kaleidoscope-info').style = 'display: block;';
  }
  document.getElementById('model').setAttribute('disabled', 'disabled');
  document.getElementById('demo').setAttribute('disabled', 'disabled');
};

const sketch = (p) => {
  let saturate = 1.0;
  let size = 1.0;
  let speed = 0.5;
  let radians = 0;

  p.setup = () => {
    p.createCanvas(video.width, video.height);
    p.colorMode(p.HSB, 100);
  }

  p.draw = () => {
    p.background(255);
    p.noStroke();

    drawVideo(p);
    if (demo == 'keypoints') drawPose(p);

    if (demo != 'kaleidoscope' || !posePoints || !posePoints[9] || !posePoints[10]) {
      return;
    } else if (posePoints[9]['score'] < CONFIDENCE_THRESHHOLDS[model] ||
        posePoints[10]['score'] < CONFIDENCE_THRESHHOLDS[model]) {
      return;
    }

    // kaleidoscope code

    let leftWrist = 9;
    let rightWrist = 10;
    if (model == "BlazePose") {
      leftWrist = 15;
      rightWrist = 16;
    }
    let leftWristX = posePoints[leftWrist]['x'];
    let leftWristY = posePoints[leftWrist]['y'];
    let rightWristX = posePoints[rightWrist]['x'];
    let rightWristY = posePoints[rightWrist]['y'];

    size = p.sqrt(p.pow(leftWristX - rightWristX, 2) + p.pow(leftWristY - rightWristY, 2)) / p.width;
    let centerX = (leftWristX + rightWristX) / 2;
    let centerY = ((leftWristY + rightWristY) / 2) - 50;

    speed = 3 * size;
    radians += speed / 30;
    
    // background kaleidoscope
    for (let i = 0; i < 12; i++) {
      p.push();
      p.translate(centerX, centerY);
      p.rotate(p.floor(i / 2) * p.PI / 3 + radians);
      
      // design
      let flip = 1;
      if (i % 2 != 0) flip = -1;
        
      p.fill(92, 50 * saturate, 70);
      p.ellipse(145 * p.pow(size, 1.3) * flip, 140 * p.pow(size, 1.3),
                30 * flip * size, 50 * size);
      p.fill(16, 86 * saturate, 98);
      p.rect(100 * p.pow(size, 1.3) * flip, 70 * p.pow(size, 1.3),
             20 * flip * size, 50 * size);
      p.fill(12, 62 * saturate, 90);
      p.ellipse(10 * p.pow(size, 1.4) * 1.5 * flip, 60 * p.pow(size, 1.4) * 1.5,
                70 * p.pow(size, 1.4), 150 * p.pow(size, 1.4));
      p.fill(34, 70 * saturate, 51);
      p.ellipse(0, 2 * p.pow(size, 1.5) * 1.5,
                50 * p.pow(size, 1.5), 30 * p.pow(size, 1.5));
      p.fill(96, 79 * saturate, 66);
      p.ellipse(75 * p.pow(size, 1.3) * flip, 75 * p.pow(size, 1.3) * 1.5,
                40 * size, 70 * size);
      p.fill(91, 92 * saturate, 38);
      p.ellipse(90 * p.pow(size, 1.2) * flip, 100 * p.pow(size, 1.2) * 1.5,
                50 * size, 50 * size);
      p.fill(51, 73 * saturate, 96);
      p.rect(120 * p.pow(size, 1) * flip, 60 * p.pow(size, 1),
             30 * flip * size, 65 * size);
      
      p.pop();
    }
    
    // foreground kaleidoscope
    for (let i = 0; i < 12; i++) {
      p.push();
      p.translate(centerX, centerY);
      p.rotate(p.floor(i / 2) * p.PI / 3 + radians);
      
      // design
      let flip = 1;
      if (i % 2 != 0) flip = -1;
        
      p.fill(92, 50 * saturate, 70);
      p.ellipse(20 * p.pow(size, 1.4) * 1.5 * flip, 40 * p.pow(size, 1.5) * 1.5,
                48 * size, 70 * size);
      p.fill(2, 69 * saturate, 100);
      p.ellipse(25 * p.pow(size, 1.5) * 1.5 * flip, 50 * p.pow(size, 1.5) * 1.5,
                40 * size, 60 * size);
      p.fill(43, 94 * saturate, 94);
      p.ellipse(75 * p.pow(size, 1.4) * 1.2 * flip, 150 * p.pow(size, 1.4) * 1.2,
                90 * size, 55 * size);
      p.fill(60, 93 * saturate, 78);
      p.ellipse(5 * p.pow(size, 2) * 0.9 * flip, 130 * p.pow(size, 2) * 0.9,
                90 * size, 55 * size);
      p.fill(92, 50 * saturate, 70);
      p.ellipse(5 * p.pow(size, 1.8) * 0.9 * flip, 120 * p.pow(size, 1.8) * 0.9,
                30 * size, 30 * size);
      p.fill(16, 86, 98);
      p.ellipse(0, 0, 10 * size, 16 * size);
      p.stroke(7, 80 * saturate, 100);
      p.strokeWeight(6);
      p.line(60 * p.pow(size, 0.8) * 0.8 * flip, 100 * p.pow(size, 0.8) * 0.8,
            -20 * p.pow(size, 0.8) * flip, 270 * p.pow(size, 1.5));
      
      p.pop();
    }
  }
}