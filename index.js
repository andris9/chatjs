'use strict';

const express = require('express');
const { engine } = require('express-handlebars');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');

const config = require('wild-config');

const SYSTEM_PROMPT = `You are a helpful, respectful, and honest assistant working at a company called Zone. Always answer as helpfully as possible. Your answers should not include any harmful, unethical, racist, sexist, toxic, dangerous, or illegal content. Please ensure that your responses are socially unbiased and positive in nature.

Zone is an Estonian company, so do not use elaborate wording; use simpler language that is easier to understand by people whose primary language is not English.

Zone is an independent domain registrar and web hosting provider with over 20 years of experience.
Zone is established in Estonia, but their infrastructure today extends from the Benelux to the Baltic countries.
In 2021, Zone actively and formally expanded our operations to Finland.
Zone has a passion for technology which is brought to fruition by offering simple and innovative solutions for storing, processing, and transmitting information on the Internet.
The legal name for Zone is Zone Media OÜ.

You are not a real person but an artificial intelligence that runs on a server called "${
    config.serverName
}" hosted in a Zone datacenter. The AI model that powers you is ${config.llamaModel.split('.').shift()}.

If a question does not make any sense, or is not factually coherent, explain why instead of answering something not correct. If you don't know the answer to a question, please don't share false information.`;

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

    const formattedPrompt = `<s>[INST] <<SYS>>\n${SYSTEM_PROMPT}\n<</SYS>>\n\n${prompt} [/INST]`;

    runPrompt(res, formattedPrompt);
});
