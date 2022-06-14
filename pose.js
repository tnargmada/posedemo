// use webgl backend 
// (the other option is wasm, which uses the gpu, but it didn't work for me)
import '@tensorflow/tfjs-backend-webgl';
import * as poseDetection from '@tensorflow-models/pose-detection';

// set configs
// most of these are the default and are optional
// see tfjs docs for more info: https://github.com/tensorflow/tfjs-models/tree/master/pose-detection
const MOVENET_CONFIG = {
  // these are all defaults, they don't need to be included
  // they are just here to show what the options are
  'modeltype': poseDetection.SINGLEPOSE_LIGHTNING,
  'enableSmoothing': true,
  'minPoseScore': 0,
  'multiPoseMaxDimension': 256,
  'enableTracking': true,
  'trackerType': poseDetection.TrackerType.BoundingBox,
  'trackerConfig': {}
}
const POSENET_CONFIG = {
  // these are all defaults
  'architecture': 'MobileNetV1',
  'outputStride': 16,
  // 'inputResolution': (setting this breaks posenet if it doesn't match the camera)
  'multiplier': 1.0,
  'quantBytes': 4,
}
const BLAZEPOSE_CONFIG = {
  'runtime': 'tfjs', // mandatory
  // everything below are defaults/optional
  'enableSmoothing': true,
  'modelType': 'full'
}

// pose detection object
class PoseDetector {
  constructor() {
    this.model = null;
    this.detector = null;
  }

  // model options: 'MoveNet', 'BlazePose', 'PoseNet' (default PoseNet)
  async createDetector(model) {
    let poseModel;
    let config;

    // set the model and the config
    if (model == 'BlazePose') {
      poseModel = poseDetection.SupportedModels.BlazePose;
      config = BLAZEPOSE_CONFIG;
    } else if (model == 'PoseNet') {
      poseModel = poseDetection.SupportedModels.PoseNet;
      config = POSENET_CONFIG;
    } else { // default to MoveNet
      poseModel = poseDetection.SupportedModels.MoveNet
      config = MOVENET_CONFIG;
    }

    console.log('here');
    
    // make the detector
    this.detector = await poseDetection.createDetector(model, config);
  }

  async detectPose(img) {
    if (this.detector) {
      return await this.detector.estimatePoses(img);
    } else {
      throw 'Pose detection error: No detector setup.';
    }
  }
}

export default PoseDetector;