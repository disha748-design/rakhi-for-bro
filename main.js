const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('output');
const canvasCtx = canvasElement.getContext('2d');

const rakhiImg = new Image();
rakhiImg.src = 'rakhi.png'; // make sure this file exists in same folder

let lastPosition = null;
let noHandFrames = 0;
const maxNoHandFrames = 10;

navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then((stream) => {
  videoElement.srcObject = stream;

  videoElement.onloadedmetadata = () => {
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;

    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults((results) => {
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        noHandFrames = 0;
        const landmarks = results.multiHandLandmarks[0];
        const wrist = landmarks[0];
        const pinkyBase = landmarks[17];
        const indexBase = landmarks[5];

        const x = wrist.x * canvasElement.width;
        const y = wrist.y * canvasElement.height;

        const dx = (indexBase.x - pinkyBase.x) * canvasElement.width;
        const dy = (indexBase.y - pinkyBase.y) * canvasElement.height;
        const wristWidth = Math.sqrt(dx * dx + dy * dy);

        let angle = Math.atan2(dy, dx);

        // Determine if wrist is vertical — rotate rakhi by 90 deg
        let deg = angle * (180 / Math.PI);
        deg = (deg + 360) % 180;

        if (deg > 60 && deg < 120) {
          angle += Math.PI / 2;
        }

        lastPosition = { x, y, angle, wristWidth };
      } else {
        noHandFrames++;
      }

      if (lastPosition && noHandFrames < maxNoHandFrames) {
        const rakhiWidth = lastPosition.wristWidth * 2.5;
        const rakhiHeight = rakhiWidth * (rakhiImg.height / rakhiImg.width);

        canvasCtx.save();
        canvasCtx.translate(lastPosition.x, lastPosition.y);
        canvasCtx.rotate(lastPosition.angle);
        canvasCtx.drawImage(
          rakhiImg,
          -rakhiWidth / 2,
          -rakhiHeight / 2,
          rakhiWidth,
          rakhiHeight
        );
        canvasCtx.restore();
      }
    });

    const camera = new Camera(videoElement, {
      onFrame: async () => {
        await hands.send({ image: videoElement });
      },
      width: 640,
      height: 480,
    });

    camera.start();
  };
  document.getElementById('captureBtn').addEventListener('click', () => {
  const canvas = document.getElementById('output');
  const dataUrl = canvas.toDataURL('image/png');

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = 'samay_rakhi_photo.png';
  link.click();
});


});
