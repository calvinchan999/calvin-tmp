export function loadImage(
  canvas: HTMLCanvasElement
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const rosMapImageObj = new Image();
    rosMapImageObj.onload = () => {
      resolve(rosMapImageObj);
    };
    rosMapImageObj.onerror = error => {
      reject(error);
    };

    if (!this.largeImageServerSideRendering) {
      // client side
      rosMapImageObj.src = canvas.toDataURL('image/jpeg');
    } else {
      // server side
      rosMapImageObj.src = `data:image/png;base64,${canvas}`;
    }
  });
}
