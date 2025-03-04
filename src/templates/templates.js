const templates = {
    template1: '/templates/template1.png',
    template2: '/templates/template2.png',
    template3: '/templates/template3.png'
};

const loadImageData = (canvas, dataUrl) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
            
            const canvasAspect = canvas.width / canvas.height;
            const imageAspect = img.width / img.height;
            let drawWidth, drawHeight;

            if (canvasAspect > imageAspect) {
                drawHeight = canvas.height;
                drawWidth = img.width * (drawHeight / img.height);
            } else {
                drawWidth = canvas.width;
                drawHeight = img.height * (drawWidth / img.width);
            }

            const x = (canvas.width - drawWidth) / 2;
            const y = (canvas.height - drawHeight) / 2;

            context.drawImage(img, x, y, drawWidth, drawHeight);
            resolve();
        };
    });
};

export { templates, loadImageData };