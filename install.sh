#!/bin/bash

unameOut="$(uname -s)"
case "${unameOut}" in
    Linux*)     machine=Linux;;
    Darwin*)    machine=Mac;;
    CYGWIN*)    machine=Cygwin;;
    MINGW*)     machine=MinGw;;
    *)          machine="UNKNOWN:${unameOut}"
esac

if ! command -v make &> /dev/null
then
    echo "Compiler is missing"
    exit 1
fi

rm -rf llama.cpp
git clone https://github.com/ggerganov/llama.cpp.git
cd llama.cpp
make clean

if [ "$machine" == "Mac" ]; then
    LLAMA_METAL=1 make
else
    make
fi

export MODEL=llama-2-13b-chat.ggmlv3.q4_0.bin
wget "https://huggingface.co/TheBloke/Llama-2-13B-chat-GGML/resolve/main/${MODEL}"

# Test

./main \
    --threads 4 \
    --n-gpu-layers 1 \
    --model ${MODEL} \
    --color \
    --ctx-size 2048 \
    --temp 0.7 \
    --repeat_penalty 1.1 \
    --n-predict -1 \
    --prompt "[INST] Tell me a joke [/INST]"

echo "If you see a joke (even a bad one) then it means the process completed successfully"