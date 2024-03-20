# Dr-Insights
## This is a medical LLM chatbot desktop app that runs completely local using an open-source LLM and RAG(retrieval augmented generation).
### Note: This is not a replacement for actual medical advise. This is merely a research project that I have worked on.

#Demo:
https://www.youtube.com/watch?v=qGTXk2GxTSo&ab_channel=ZAPPY

## <ins> Installation </ins>
## There are 2 folders for frontend and backend. backend is a flask server that uses llama.cpp as model loader and frontend is using Electron.js.
## 1.Download the dependencies by running this in the frontend folder
```
npm i
```
## and running this in the backend folder
```
pip install -r requirements.txt
```
## 2.Download the model from here: https://huggingface.co/TheBloke/OpenHermes-2.5-Mistral-7B-GGUF/blob/main/openhermes-2.5-mistral-7b.Q4_K_M.gguf and place it in the backend folder
## 3.Download the pre-vectorized chroma database from here: https://drive.google.com/drive/folders/1dIawbd6pwLgDs_FcgmgAaIwXrJiNJVzU?usp=sharing and place the chroma_db folder in the backend folder as well
### This vector database is created from the MASHQA dataset(https://github.com/mingzhu0527/MASHQA) which has 60k+ QA pairs taken from WebMD and PubMed
## 4.Use openai api key for pro features version otherwise comment it out that part
## 5.Start the flask server to start model inference and start the frontend app using npm run
