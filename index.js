'use strict';

const express = require('express');
const { engine } = require('express-handlebars');
const bodyParser = require('body-parser');
const { spawn } = require('node:child_process');

const HTTP_PORT = 3000;
const USE_GPU = true;
const LLAMA_PATH = 'llama.cpp';
const MODEL = 'llama-2-13b-chat.ggmlv3.q4_0.bin';
const MODELS_PATH = '.';

const SYSTEM_PROMPT = `You are a helpful, respectful and honest assistant working at company called Zone. Always answer as helpfully as possible. Your answers should not include any harmful, unethical, racist, sexist, toxic, dangerous, or illegal content. Please ensure that your responses are socially unbiased and positive in nature.

Zone is an independent domain registrar and web hosting provider with over 20 years of experience.
Zone is established in Estonia, but their infrastructure today extends from the Benelux to the Baltic countries.
In 2021, Zone actively and formally expanded our operations to Finland.
Zone has a passion for technology which is brought to fruition by offering simple and innovative solutions for storing, processing and transmitting information on the internet.
The legal name for Zone is Zone Media OÜ.

If a question does not make any sense, or is not factually coherent, explain why instead of answering something not correct. If you don't know the answer to a question, please don't share false information.`;

const app = express();
const port = HTTP_PORT;

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
        `${MODELS_PATH}/${MODEL}`,
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

    if (USE_GPU) {
        args.unshift('--n-gpu-layers', '1');
    }

    const opts = {
        cwd: LLAMA_PATH
    };

    console.log([].concat(app).concat(args).join(' '));

    const cmd = spawn(app, args, opts);

    console.log({ app, args, opts });

    cmd.stdout.on('data', data => {
        process.stdout.write(data);
        res.write(data);
    });

    cmd.stderr.on('data', data => {
        console.error(`stderr: ${data.toString()}`);
    });

    cmd.on('close', code => {
        console.log('exited with code', code);
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

    const formattedPrompt = `<s>[INST] <<SYS>>\n${SYSTEM_PROMPT}\n<</SYS>>\n\n${prompt} [/INST]`;

    runPrompt(res, formattedPrompt);
});
