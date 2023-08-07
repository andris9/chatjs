'use strict';

/* globals document, XMLHttpRequest, marked */
/* eslint no-control-regex: 0 */

document.addEventListener('DOMContentLoaded', () => {
    const promptForm = document.getElementById('prompt-form');
    const promptElm = document.getElementById('user-prompt');
    const outputElm = document.getElementById('output');

    let textValue = '';

    function resetFormSubmit(form) {
        for (let icon of form.querySelectorAll('i.icon-updated')) {
            icon.classList.remove('bi-gear-wide-connected', 'spinner', 'icon-updated');
            if (icon.dataset.oldIcon) {
                icon.classList.add(icon.dataset.oldIcon);
                icon.dataset.oldIcon = '';
            }
        }

        for (let b of form.querySelectorAll('.button-disabled')) {
            b.classList.remove('button-disabled');
            b.disabled = false;
        }
        textValue = '';
    }

    function clearConsole() {
        outputElm.innerHTML = '';
    }

    function writeToConsole(str) {
        textValue += str;

        let sourceTxt = textValue
            .replace(/\r?\n/g, '\x04')
            .replace(/\s*<s>.*\[\/INST\]\s*/i, '')
            .replace(/\[end of text\]/i, ' ')
            .replace(/ +/g, ' ')
            .trim()
            .replace(/\x04/g, '\n');

        outputElm.innerHTML = marked.parse(sourceTxt);

        outputElm.scrollIntoView();
    }

    for (let f of document.querySelectorAll('form.pending-form')) {
        f.addEventListener('submit', () => {
            for (let b of f.querySelectorAll('button[type="submit"], button:not([type])')) {
                b.disabled = true;
                b.classList.add('button-disabled');
                let icon = b.querySelector('i.bi');
                if (icon) {
                    for (let [, className] of icon.classList.entries()) {
                        if (/^bi-/.test(className)) {
                            icon.classList.remove(className);
                            icon.dataset.oldIcon = className;
                            icon.classList.add('icon-updated');
                        }
                    }
                    icon.classList.add('bi-gear-wide-connected', 'spinner');
                }
            }
        });
    }

    if (promptForm) {
        promptForm.addEventListener('submit', e => {
            e.preventDefault();

            const prompt = promptElm.value;

            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/chat');
            xhr.seenBytes = 0;

            clearConsole();
            textValue = '';

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 3) {
                    const newData = xhr.response.substr(xhr.seenBytes);
                    xhr.seenBytes = xhr.responseText.length;
                    writeToConsole(newData);
                }

                if (xhr.readyState === 4) {
                    resetFormSubmit(promptForm);
                }
            };

            xhr.addEventListener('error', e => {
                writeToConsole(`\n\nError: ${(e && e.message) || e}`);
                resetFormSubmit(promptForm);
            });

            xhr.setRequestHeader('Content-type', 'application/json');
            xhr.send(JSON.stringify({ prompt }));
        });
    }
});
