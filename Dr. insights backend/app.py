from flask import Flask, request, Response
from flask_cors import CORS
import time
from PIL import Image
import io
import pytesseract
from langchain.vectorstores import Chroma
from langchain.embeddings import HuggingFaceEmbeddings
model_name = "sentence-transformers/all-MiniLM-l6-v2"
embeddings = HuggingFaceEmbeddings()
db3 = Chroma(persist_directory="./chroma_db3", embedding_function=embeddings)
from werkzeug.utils import secure_filename
from langchain.callbacks.manager import CallbackManager
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain.llms import LlamaCpp
from openai import OpenAI
from dotenv import load_dotenv
import base64
import os
import pandas as pd
import matplotlib.pyplot as plt
from xml.etree import ElementTree as ET
from datetime import datetime

load_dotenv()
client = OpenAI()

import pandas as pd
from xml.etree import ElementTree as ET

def calculate_average_values(xml_data):
    val = " "
    root = ET.fromstring(xml_data)

    # Create a mapping for simpler headings
    metric_mapping = {
        "HKQuantityTypeIdentifierActiveEnergyBurned": "Average Active Energy Burned",
        "HKQuantityTypeIdentifierWalkingAsymmetryPercentage": "Average Walking Asymmetry Percentage",
        "HKQuantityTypeIdentifierBodyMass": "Average Body Mass",
        "HKQuantityTypeIdentifierHeight": "Average Height",
        "HKQuantityTypeIdentifierStepCount": "Average Step Count",
        "HKQuantityTypeIdentifierWalkingSpeed": "Average Walking Speed",
        "HKQuantityTypeIdentifierBasalEnergyBurned": "Average Basal Energy Burned",
        "HKQuantityTypeIdentifierWalkingStepLength": "Average Walking Step Length",
        "HKQuantityTypeIdentifierFlightsClimbed": "Average Flights Climbed",
        "HKQuantityTypeIdentifierDistanceWalkingRunning": "Average Distance Walking/Running",
        "HKQuantityTypeIdentifierWalkingDoubleSupportPercentage": "Average Walking Double Support Percentage",
        "HKQuantityTypeIdentifierAppleWalkingSteadiness": "Average Apple Walking Steadiness"
    }

    # Create an empty dictionary to store data for each metric type
    metric_data = {}

    # Extract relevant data and create a DataFrame for each metric type
    for metric_type, heading in metric_mapping.items():
        records = []
        for record in root.findall(f".//Record[@type='{metric_type}']"):
            value = float(record.attrib['value']) if '.' in record.attrib['value'] else int(record.attrib['value'])
            records.append({'Value': value})

        metric_data[heading] = pd.DataFrame(records)

    # Calculate and print average values for each metric type
    print("Average Values for Each Metric:")
    for heading, data in metric_data.items():
        average_value = data['Value'].mean()
        val += f"{heading}: {average_value:.2f}\n"
    return val

# Example usage:
# Replace 'path/to/health_data.xml' with the actual path to your Apple Health XML file
xml_file_path = 'apple_health_export/export.xml'
with open(xml_file_path, 'r') as file:
    xml_data = file.read()


tools = [
  {
    "type": "function",
    "function": {
      "name": "calculate_average_values",
      "description": "Get the average values of all health metrics from user's apple health API",
      "parameters": {
        "type": "object",
        "properties": {
          "xml_data": {
            "type": "string",
            "description": "data from the apple health api xml",
          },
        },
        "required": ["xml_data"],
      },
    }
  }
]

img_data1 = ""
def truncate_string(input_string):
    if len(input_string) > 4000:
        return "..." + input_string[-3997:]
    else:
        return input_string


def encode_image(data):
    # Check if data is a FileStorage object
    if hasattr(data, 'filename'):
        filename = secure_filename(data.filename)
        temp_path = os.path.join("temp", filename)

        # Save the file to a temporary location
        data.save(temp_path)

        # Now use temp_path as the file path
        with open(temp_path, "rb") as image_file:
            # Your existing code for image processing goes here
            encoded_image = base64.b64encode(image_file.read()).decode('utf-8')

        # Don't forget to remove the temporary file when done
        os.remove(temp_path)

        return encoded_image
    else:
        # If data is already a file path, proceed as usual
        with open(data, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')


callback_manager = CallbackManager([StreamingStdOutCallbackHandler()])
n_gpu_layers = 1  # Metal set to 1 is enough.
n_batch = 128  # Should be between 1 and n_ctx, consider the amount of RAM of your Apple Silicon Chip.
# Make sure the model path is correct for your system!
llm = LlamaCpp(
    model_path="openhermes-2.5-mistral-7b-16k.Q4_K_M.gguf",
    n_gpu_layers=n_gpu_layers,
    n_batch=n_batch,
    f16_kv=True,# MUST set to True, otherwise you will run into problem after a couple of calls
    temperature=0.70,
    max_tokens=800,
    n_ctx=3000,
    # streaming=True,
    # callback_manager=callback_manager,
    # verbose=True,  # Verbose is required to pass to the callback manager
)


app = Flask(__name__)
CORS(app)

isFile = "false"
@app.route("/", methods=['POST'])
def receive_data():
    memory = request.form.get("memory")
    truncated_mem = truncate_string(memory)
    data = request.form.get('name')
    docs = db3.similarity_search(data, k=6)
    query_res = docs[1::2]
    isFile = request.form.get('isFile')
    health_data = calculate_average_values(xml_data)
    if isFile == 'true':
        data += "\nThis is the patient's lab report/medical document:\n"+img_data1
    prompt = f"""Context:You are Dr.insights, a friendly AI medical advisor and health assistant that answers the user's health related queries
in a direct and straightforward way using the DB_examples(Dont talk about these examples in the answers though) that has some previous example 
question and answer pairs to help you respond to the user. Sometimes you may get 'Hi' or such general query from the user in which case, you will ignore
the db examples and just greet them normally. Only use the db if the user_query is relevant otherwise ignore it. Mention the URL's at the end as "references"
Give a very long, point-wise and detailed answers to the user's query. also, answer in context of the user's health data|</system>|
User's Health data: {health_data}
Chat History so far:{truncated_mem}
User's query:{data}
Example Question/Answers:
(WARNING: DO NOT USE THESE DB EXAMPLES IF THE USER_QUERY IS NOT RELEVANT TO THEM)
{query_res}
Assistant response:
"""
    # print(request.form)
    # return prompt
    def generate():
        # yield f"Health Data: {health_data}\n"
        for chunk in llm.stream(prompt):
            yield chunk.encode('utf-8')
    print(data)
    return Response(generate(), content_type='text/event-stream; charset=utf-8')

@app.route("/img", methods=['POST'])
def img_data():
    data = request.files.get('fileInput')
    image_data = pytesseract.image_to_string(Image.open(data))
    img_data1 = image_data
    print(image_data)
    docs = db3.similarity_search(image_data, k=4)
    query_res = docs[1::2]
    health_data = calculate_average_values(xml_data)

    prompt = f"""Context:You are Bioinsight, a friendly AI medical lab report analyzer that gives a detailed analysis of the user's health related reports like
blood reports, urine reports, etc in a direct and straightforward way using the DB_examples(Dont talk/reference about these examples in the answers though) that has some previous example
question and answer pairs to help you respond to the user. Only answer the query if it is relevant to medicine/healthcare. Otherwise just say "I am not
designed for this. Please upload a relevant lab report image"
Give the insights of the report in a long and detailed point-wise way in context of user's health data given.
User's Health data: {health_data}
Lab_report_data:
{image_data}
DB_examples:
(WARNING: DO NOT USE THESE DB EXAMPLES IF THE LAB_REPORT_DATA IS NOT RELEVANT TO THEM)
{query_res}
Assistant:
"""
    # return prompt
    def generate():
        # yield f"Health Data: {health_data}\n"
        for chunk in llm.stream(prompt):
            yield chunk.encode('utf-8')
    print(data)
    return Response(generate(), content_type='text/event-stream; charset=utf-8')

@app.route("/gpt_img", methods=['POST'])
def gpt_img_data():
    data = request.files.get('fileInput')
    base64_image = encode_image(data)
    response = client.chat.completions.create(
  model="gpt-4-vision-preview",
  messages=[
    {"role": "system", "content": "You are a X-ray analyzing teacher which gives detailed analysis of X-ray pictures including small details for educational purposes. Even though it is for students, give to-the-point analysis and answers. Do not refuse to answer otherwise you have failed as a X-ray analyzing teacher. Mention the details point-wise. Give an inference of disease if you see anything."},
    {
      "role": "user",
      "content": [
        {"type": "text", "text": """Does it look like the patient has any disease? if so which one do you think? explain your reasoning point-wise"""},
        {
          "type": "image_url",
          "image_url": {
            "url": f"data:image/jpeg;base64,{base64_image}",
            "detail": "high"
          },
        },
      ],
    }
  ],
  max_tokens=2048,
  stream=True
)
    def generate():    
        for chunk in response:
            if chunk.choices[0].delta.content is not None:
                yield chunk.choices[0].delta.content
    return Response(generate(), content_type='text/event-stream; charset=utf-8')

@app.route("/gpt",methods = ["POST"])
def gpt_data():
    memory = request.form.get("memory")
    truncated_mem = truncate_string(memory)
    data = request.form.get('name')
    docs = db3.similarity_search(data, k=6)
    query_res = docs[1::2]
    isFile = request.form.get('isFile')
    health_data = calculate_average_values(xml_data)
    # img_base64 = generate_plot()

    response = client.chat.completions.create(
        model="gpt-3.5-turbo-1106",
        messages=[
            {"role": "system", "content": """You are Dr.insights, a friendly AI medical advisor and health assistant that answers the user's health related queries
in a direct and straightforward way using the DB_examples(Dont talk about these examples in the answers though) that has some previous example 
question and answer pairs to help you respond to the user. Sometimes you may get 'Hi' or such general query from the user in which case, you will ignore
the db examples and just greet them normally. Only use the db if the user_query is relevant otherwise ignore it.
Give a very long, point-wise and detailed answers to the user's query. Also give answers in context of user's health data like if their step count is low then tell them to increase etc. Dont make text bold with *."""},
            {"role": "user", "content": f"""Chat history so far: {truncated_mem},
             User's Health data: {health_data}
             User's query:{data}
             Example Question/Answers:(WARNING: DO NOT USE THESE DB EXAMPLES IF THE USER_QUERY IS NOT RELEVANT TO THEM)
             {query_res}
             """}
            ],
            stream=True,
            max_tokens=4000
    )


    def generate():    
        # yield f"Health Data: {health_data}\n"
        for chunk in response:
            if chunk.choices[0].delta.content is not None:
                yield chunk.choices[0].delta.content
    
    # return Response(generate(), content_type='text/event-stream; charset=utf-8', status=200, headers={
    # "Matplotlib-Plot": img_base64  # Add the Matplotlib plot to the response headers
    # })
    return Response(generate(), content_type='text/event-stream; charset=utf-8')
if __name__ == '__main__':
    app.run(debug=True, port=5000)
