const express = require('express');
const vkQr = require('@vkontakte/vk-qr');
const { createCanvas, Image } = require('canvas');
const path = require('path');

const APP_ID = 7150862;
const APP_LINK = `https://vk.com/app${APP_ID}`;

const app = express();
const port = 3000;

const userPicPrepare = (url) => new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = createCanvas(200, 200);

    img.onload = () => {
        const ctx = canvas.getContext('2d');
        const radius = 100;

        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, 200, 200);

        ctx.beginPath();
        ctx.arc(radius, radius, radius, 0, Math.PI * 2, true);
        ctx.clip();

        ctx.drawImage(img, 0, 0);

        resolve(canvas.toDataURL());
    };

    img.onerror = () => reject('Failed load user pic');

    img.crossOrigin = 'Anonymous';
    img.src = url;
});

app.get('/', async (request, response) => {
    const { token, userPic } = request.query;
    const qr = vkQr.createQR(`${APP_LINK}#token=${token}`, {
        qrSize: 600,
        isShowLogo: userPic && userPic.indexOf('https://vk.com/images/camera_200.png') === -1,
        isShowBackground: true,
        foregroundColor: '#327CF6'
    });

    const canvas = createCanvas(640, 640);
    const ctx = canvas.getContext('2d');

    var svgData = 'data:image/svg+xml;charset=utf-8,' + qr;

    var svg = new Image();

    svg.onload = async () => {
        ctx.drawImage(svg, 10, 10, 600, 600);

        const logo = new Image();

        logo.onload = () => {
            ctx.drawImage(logo, 248, 248, 114, 114);

            canvas.toBuffer((err, buf) => {
                if (err) response.sendError('Dont');

                response.setHeader('Cache-Control', 'no-cache');
                response.setHeader('Content-Type', 'image/png');
                response.send(buf);
            }, 'image/png', { compressionLevel: 3, filters: canvas.PNG_FILTER_NONE });
        };

        logo.onerror = () => response.sendError('Dont load logo');

        logo.src = await userPicPrepare(userPic);
    };

    svg.onerror = () => response.sendError('Dont load svg');

    svg.src = svgData;
});

app.get('/sign', (_, response) => {
    response.setHeader('Content-Type', 'image/png');
    response.sendFile(path.join(__dirname, 'images/sign.png'));
});

app.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }

    console.log(`server is listening on ${port}`)
});