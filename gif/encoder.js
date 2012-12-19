importScripts('LZWEncoder.js', 'NeuQuant.js', 'GIFEncoder.js');

var encoder;
onmessage = function (e) {
  if (e.data.cmd === "start") {
    encoder = new GIFEncoder();

    var data = e.data.data;
    encoder.setRepeat(data.repeat);
    encoder.setDelay(data.delay);
    encoder.setSize(data.width, data.height);

    encoder.start();
  } else
  if (e.data.cmd === "finish") {
    encoder.finish();
    postMessage(encoder.stream().getData());
  } else 
  if (e.data.cmd === "frame"){
    encoder.addFrame(e.data.data, true);
  }
};

