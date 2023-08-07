'use strict';

const express = require('express');
const { engine } = require('express-handlebars');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');

const config = require('wild-config');

const app = express();
const port = config.httpPort;

app.engine('.hbs', engine({ extname: '.hbs' }));
app.set('view engine', '.hbs');
app.set('views', './views');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static('static'));

app.get('/', (req, res) => {
    res.render('home');
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

function runPrompt(res, prompt) {
    const app = './main';
    const args = [
        '--model',
        `${config.modelsPath}/${config.llamaModel}`,
        '--threads',
        '8',
        '--ctx-size',
        '2048',
        '--temp',
        '0.7',
        '--repeat_penalty',
        '1.1',
        '--n-predict',
        '-1',
        '-p',
        `${prompt}`
    ];

    if (config.useGPU) {
        args.unshift('--n-gpu-layers', '1');
    }

    const opts = {
        cwd: config.llamaPath
    };

    console.log([].concat(app).concat(args).join(' '));

    const cmd = spawn(app, args, opts);

    console.log({ app, args, opts });

    cmd.stdout.on('data', data => {
        process.stdout.write(data);
        res.write(data);
    });

    cmd.stderr.on('data', data => {
        process.stderr.write(data);
    });

    cmd.on('close', code => {
        console.log('LLama2 exited with code', code);
        res.end();
    });
}

app.post('/api/chat', (req, res) => {
    const prompt = (req.body.prompt || '').toString().trim();

    console.log(req.body, prompt);

    res.writeHead(200, {
        'Cache-Control': 'no-cache',
        'Content-Type': 'text/plain'
    });

    if (!prompt) {
        return res.end();
    }

    const formattedPrompt = `<s>[INST] <<SYS>>\n${config.systemPrompt}\n<</SYS>>\n\n${prompt} [/INST]`;

    runPrompt(res, formattedPrompt);
});
